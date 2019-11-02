import logging
import os
import random
from datetime import datetime
from typing import Dict

from allennlp.data.dataset_readers.dataset_reader import DatasetReader
from allennlp.data.fields import MetadataField, TextField
from allennlp.data.instance import Instance
from allennlp.data.token_indexers import TokenIndexer
from allennlp.data.tokenizers import Tokenizer
from overrides import overrides
from PIL import Image
from pymongo import MongoClient
from torchvision.transforms import (CenterCrop, Compose, Normalize, Resize,
                                    ToTensor)

from newser.data.fields import ImageField, ListTextField

logger = logging.getLogger(__name__)  # pylint: disable=invalid-name


@DatasetReader.register('nytimes_hierarchical')
class NYTimesHierarchicalReader(DatasetReader):
    """Read from the New York Times dataset.

    See the repo README for more instruction on how to download the dataset.

    Parameters
    ----------
    tokenizer : ``Tokenizer``
        We use this ``Tokenizer`` for both the premise and the hypothesis.
        See :class:`Tokenizer`.
    token_indexers : ``Dict[str, TokenIndexer]``
        We similarly use this for both the premise and the hypothesis.
        See :class:`TokenIndexer`.
    """

    def __init__(self,
                 tokenizer: Tokenizer,
                 token_indexers: Dict[str, TokenIndexer],
                 image_dir: str,
                 mongo_host: str = 'localhost',
                 mongo_port: int = 27017,
                 lazy: bool = True) -> None:
        super().__init__(lazy)
        self._tokenizer = tokenizer
        self._token_indexers = token_indexers
        self.client = MongoClient(host=mongo_host, port=mongo_port)
        self.db = self.client.nytimes
        self.image_dir = image_dir
        self.preprocess = Compose([
            ToTensor(),
            Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])])
        random.seed(1234)

    @overrides
    def _read(self, split: str):
        # split can be either train, valid, or test
        # validation and test sets contain 10K examples each
        if split == 'train':
            start = datetime(2000, 1, 1)
            end = datetime(2019, 5, 1)
        elif split == 'valid':
            start = datetime(2019, 5, 1)
            end = datetime(2019, 6, 1)
        elif split == 'test':
            start = datetime(2019, 6, 1)
            end = datetime(2019, 9, 1)
        else:
            raise ValueError(f'Unknown split: {split}')

        # Setting the batch size is needed to avoid cursor timing out
        # We collected 1.7M articles
        article_cursor = self.db.articles.find({
            'parsed': True,  # article body is parsed into paragraphs
            'n_images': {'$gt': 0},  # at least one image is present
            'pub_date': {'$gte': start, '$lt': end},
            'language': 'en',
        }, no_cursor_timeout=True).batch_size(128)

        for article in article_cursor:
            sections = article['parsed_section']
            image_positions = article['image_positions']
            for pos in image_positions:
                title = ''
                if 'main' in article['headline']:
                    title = article['headline']['main'].strip()
                paragraphs = [s['text'].strip()
                              for s in sections if s['type'] == 'paragraph']
                if title:
                    paragraphs.insert(0, title)
                caption = sections[pos]['text'].strip()
                if not caption:
                    continue

                image_path = os.path.join(
                    self.image_dir, f"{sections[pos]['hash']}.jpg")
                try:
                    image = Image.open(image_path)
                except (FileNotFoundError, OSError):
                    continue

                yield self.article_to_instance(paragraphs, image, caption, image_path, article['web_url'])

        article_cursor.close()

    def article_to_instance(self, paragraphs, image, caption, image_path, web_url) -> Instance:

        context_tokens_list = [
            self._tokenizer.tokenize(par) for par in paragraphs]
        caption_tokens = self._tokenizer.tokenize(caption)

        fields = {
            'context': ListTextField([TextField(par, self._token_indexers)
                                      for par in context_tokens_list]),
            'image': ImageField(image, self.preprocess),
            'caption': TextField(caption_tokens, self._token_indexers),
        }

        metadata = {'context': '\n'.join(paragraphs).strip(),
                    'caption': caption,
                    'web_url': web_url,
                    'image_path': image_path}
        fields['metadata'] = MetadataField(metadata)

        return Instance(fields)