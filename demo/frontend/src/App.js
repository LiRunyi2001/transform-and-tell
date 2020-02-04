import React, { Component } from 'react';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articleURL: '',
      imagePosition: 0,
      isLoaded: false,
      isLoading: false,
      isScraped: false,
      isScraping: false,
      article: null,
      title: '',
      sections: [],
      imageURL: '',
      imageURLs: [],
      start: '',
      before: '',
      after: '',
      trueCaption: '',
      generatedCaption: '',
      hasError: false,
      errorMessage: '',
      showModal: false,
    };
  }

  componentDidMount() {
    document.body.classList.add('bg-light');
  }

  scrapeArticle = e => {
    e.preventDefault();
    this.setState({
      isScraped: false,
      isScraping: true,
      isLoaded: false,
      hasError: false,
      imagePosition: 0,
    });
    const query = {
      url: this.state.articleURL,
    };
    axios
      .post('/api/scrape/', query)
      .then(res => {
        if (res.data.error) {
          this.setState({
            isScraping: false,
            hasError: true,
            isScraped: false,
            errorMessage: res.data.error,
          });
        } else {
          this.setState({
            isScraped: true,
            isScraping: false,
            imageURLs: res.data.image_urls,
            sections: res.data.sections,
            title: res.data.title,
          });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  fetchCaption = e => {
    e.preventDefault();
    this.setState({ isLoaded: false, isLoading: true, hasError: false });

    const query = {
      sections: this.state.sections,
      title: this.state.title,
      pos: this.state.imagePosition,
    };
    axios
      .post('/api/caption/', query)
      .then(res => {
        if (res.data.error) {
          this.setState({
            isLoading: false,
            hasError: true,
            isLoaded: false,
            errorMessage: res.data.error,
          });
        } else {
          this.setState({
            isLoaded: true,
            isLoading: false,
            title: res.data.title,
            imageURL: res.data.image_url,
            start: res.data.start,
            before: res.data.before,
            after: res.data.after,
            trueCaption: res.data.true_caption,
            generatedCaption: res.data.generated_caption,
          });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  handleURLChange = e => {
    this.setState({
      articleURL: e.target.value,
      isScraped: false,
      isLoaded: false,
    });
  };

  selectArticle = e => {
    this.setState({
      articleURL: e.target.getAttribute('url'),
      isScraped: false,
      isLoaded: false,
    });
  };

  showModal = e => {
    this.setState({ showModal: true });
  };

  handleClose = e => {
    this.setState({ showModal: false });
  };

  handleImagePositionChange = (index, e) => {
    console.log(e);
    console.log(index);
    this.setState({ imagePosition: index, isLoaded: false });
  };

  splitNewLines = text =>
    text.split('\n').map((item, key, arr) => (
      <span key={key}>
        {item}
        {arr.length - 1 === key ? (
          <div />
        ) : (
          <div>
            <br />
            <br />
          </div>
        )}
      </span>
    ));

  render() {
    const examples = [
      {
        title:
          "'Turn Off the Sunshine': Why Shade Is a Mark of Privilege in Los Angeles",
        url:
          'https://www.nytimes.com/2019/12/01/us/los-angeles-shade-climate-change.html',
      },
      {
        title: 'Ready, Set, Ski! In China, Snow Sports are the Next Big Thing',
        url:
          'https://www.nytimes.com/2019/11/27/travel/Skiing-in-China-Olympics.html',
      },
      {
        title: 'Muhammad Ali in a Broadway Musical? It Happened',
        url:
          'https://www.nytimes.com/2019/11/28/theater/muhammad-ali-broadway-buck-white.html',
      },
      {
        title:
          'New Strawberry-Flavored H.I.V. Drugs for Babies Are Offered at $1 a Day',
        url:
          'https://www.nytimes.com/2019/11/29/health/AIDS-drugs-children.html',
      },
      {
        title:
          'Dr. Janette Sherman, 89, Early Force in Environmental Science, Dies',
        url:
          'https://www.nytimes.com/2019/11/29/health/dr-janette-sherman-dead.html',
      },
    ];

    return (
      <div className="container">
        <Modal show={this.state.showModal} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Abstract</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            We propose an end-to-end model for generating image captions in news
            articles. News images present two interesting challenges: being
            aware of real-world knowledge, especially about named entities; and
            generating linguistically rich captions including rare words, often
            the names of people and places. We address the first challenge by
            associating words in the caption with faces in the image and names
            in surrounding article text, via a multi-modal, multi-head attention
            mechanism. We tackle the second challenge with a state-of-the-art
            transformer language model, along with a copying mechanism and
            byte-pair-encoding that generates captions as a sequence of word
            parts. We introduce the NYTimes800k dataset, which is 70% larger
            than GoodNews, has higher article qualities and includes the
            contextual cue of image location within an article. Our model
            achieves CIDEr scores of 61 on GoodNews and 65 on NYTimes800k
            datasets, significantly outperforming the state-of-the-art CIDEr of
            13 on GoodNews. We also show successive performance gains from
            language models, word representation, intelligent copying
            mechanisms, face embeddings, and other improvements in neural
            network representations.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="py-5">
          <h2 className="text-center">Transform and Tell</h2>
          <p className="lead text-center">
            Demo accompanying the paper{' '}
            <em>Transform and Tell: Entity-Aware News Image Captioning</em>.
          </p>
          <p>
            Transform and Tell is a captioning model that takes a news image and
            generate a caption for it using information from the article, with a
            special focus on faces and names. To see the abstract, click{' '}
            <a href="#abstractModal" onClick={this.showModal}>
              here
            </a>
            . To see it in action, click on one of the following examples:
          </p>

          <div className="list-group">
            {examples.map((example, index) => (
              <button
                key={index}
                type="button"
                className={
                  'list-group-item list-group-item-action' +
                  (this.state.articleURL === example.url
                    ? ' list-group-item-secondary'
                    : '')
                }
                onClick={this.selectArticle}
                url={example.url}
              >
                {example.title}
              </button>
            ))}
          </div>
          <br />
          <form>
            <div className="form-group">
              <label htmlFor="articleURL">
                Or manually provide the URL to a New York Times article:
              </label>
              <input
                type="url"
                className="form-control"
                id="articleURL"
                aria-describedby="urlHelp"
                placeholder="Article URL"
                value={this.state.articleURL}
                onChange={this.handleURLChange}
              />
            </div>
            <button
              type="submit"
              className="btn btn-lg btn-primary"
              onClick={this.scrapeArticle}
              disabled={this.state.isScraping}
            >
              {this.state.isScraping ? 'Scraping Article...' : 'Scrape Article'}
            </button>

            {this.state.isScraped && (
              <div className="my-2">
                <p>Choose an image to caption:</p>
                <div className="row">
                  {this.state.imageURLs.map((url, index) => (
                    <div key={index} className="col-md-2 mb-2">
                      <img
                        className={
                          'img-thumbnail' +
                          (this.state.imagePosition === index
                            ? ' border border-primary'
                            : '')
                        }
                        src={url}
                        key={index}
                        alt=""
                        onClick={this.handleImagePositionChange.bind(
                          this,
                          index
                        )}
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  className="btn btn-lg btn-primary"
                  onClick={this.fetchCaption}
                  disabled={this.state.isLoading}
                >
                  {this.state.isLoading
                    ? 'Running Model...'
                    : 'Generate Caption'}
                </button>
              </div>
            )}
          </form>
        </div>

        {this.state.hasError && (
          <div className="alert alert-danger" role="alert">
            {this.state.errorMessage}
          </div>
        )}
        {this.state.isLoaded && (
          <div className="row">
            <div className="col-md-6 mb-4 alert alert-secondary">
              <h4 className="mb-3">{this.state.title}</h4>

              <div className="mb-3">
                {this.splitNewLines(this.state.start)}
                {this.splitNewLines(this.state.before)}
              </div>
              <div className="mb-3">
                <img src={this.state.imageURL} className="img-fluid" alt="" />
              </div>
              <div className="mb-3">{this.splitNewLines(this.state.after)}</div>
            </div>
            <div className="col-md-6 mb-4">
              {/* <h4 className="mb-3">Ground-truth caption</h4>
              <div className="mb-3">{this.state.trueCaption}</div> */}
              <div className="alert alert-success">
                <h4 className="mb-3">Generated caption</h4>
                <div className="mb-3">{this.state.generatedCaption}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
export default App;