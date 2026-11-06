"""Refresh recent uploads and advance a bounded historical cursor per publisher."""


def scan_uploads(api, channel, previous=None):
    from .youtube import YouTubeHTTPError
    playlist = channel['uploadsPlaylistId']
    ids = set()

    def page(token=None):
        result = api.get('playlistItems', part='contentDetails', playlistId=playlist,
                         maxResults=50, **({'pageToken': token} if token else {}))
        ids.update(item['contentDetails']['videoId'] for item in result.get('items', []))
        return result.get('nextPageToken')

    token = None
    for _ in range(channel.get('collectionPages', 1)):
        token = page(token)
        if not token:
            break
    recent_end = token
    old = previous if previous and previous.get('playlistId') == playlist else {}
    state = {'playlistId': playlist, 'nextPageToken': old.get('nextPageToken', recent_end),
             'completed': old.get('completed', not bool(recent_end)),
             'historicalPages': old.get('historicalPages', 0)}
    if not recent_end:
        state.update(nextPageToken=None, completed=True)
    for _ in range(channel.get('archivePages', 0)):
        if state['completed']:
            break
        try:
            token = page(state['nextPageToken'])
        except YouTubeHTTPError as exc:
            if exc.status != 400:
                raise
            # Playlist edits can invalidate a cursor. Keep recent data and restart
            # historical paging next time; authentication/quota errors still fail.
            state.update(nextPageToken=recent_end, completed=not bool(recent_end))
            break
        state.update(nextPageToken=token, completed=not bool(token),
                     historicalPages=state['historicalPages'] + 1)
    return ids, state
