"""Only reviewed original publishers may supply SONAR records."""

ORIGINAL_KINDS = {'broadcaster', 'production', 'program', 'brand', 'artist-label'}


def approved_original(channel):
    if channel.get('official') is True:
        return True
    review = channel.get('publisherReview', {})
    return (review.get('status') == 'approved'
            and review.get('kind') in ORIGINAL_KINDS
            and isinstance(review.get('evidenceUrl'), str)
            and review['evidenceUrl'].startswith('https://'))
