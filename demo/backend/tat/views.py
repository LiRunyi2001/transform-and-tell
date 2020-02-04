import json
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from tell.client import CaptioningClient

from .extractor import ExtractError, extract_article, get_urls

client = CaptioningClient(ip='localhost', port=5558, port_out=5559)


def visitor_ip_address(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@csrf_exempt
def get_image_urls(request):
    query = json.loads(request.body)

    with open('queries.log', 'a') as f:
        f.write(f"{datetime.now()} {visitor_ip_address(request)} "
                f"{query['url'].strip()}\n")

    if not query['url'].strip():
        return JsonResponse({'error': 'The URL cannot be empty.'})
    if 'nytimes.com' not in query['url']:
        return JsonResponse({'error': 'The URL must come from nytimes.com'})

    try:
        output = get_urls(query['url'])
    except ExtractError as e:
        return JsonResponse({'error': str(e)})
    except Exception:
        return JsonResponse({'error': 'Cannot parse the article. Pick another URL.'})

    return JsonResponse(output)


@csrf_exempt
def post_caption(request):
    query = json.loads(request.body)

    print(query.keys())

    article = extract_article(query['sections'], query['title'], query['pos'])
    output = client.parse([article])[0]

    data = {
        'title': article['title'],
        'image_url': article['image_url'],
        'generated_caption': output['caption'],
        'true_caption': article['true_caption'],
        'start': output['start'],
        'before': output['before'],
        'after': output['after'],
    }
    return JsonResponse(data)