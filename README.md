# Music Player

A web music player built with TypeScript and Vite. The playlist is a hand-written **doubly linked list**.

## Features
- Add a song at the start, at the end or at any position.
- Remove a song.
- Next and previous song. Optional "repeat list".
- Drag and drop to reorder songs.
- Songs from any computer: pick audio files from the device you are using, or add any audio URL from the web.

## Design (OOP)
| Class | Responsibility |
|---|---|
| `DoublyNode<T>` | One link: value, `previous`, `next`. |
| `DoublyLinkedList<T>` | The data structure: insert, remove, move, find. No arrays inside. |
| `Song` | One song (title, playable source, origin). |
| `Playlist` | Songs in a list plus a reference to the song that is playing. |
| `PlayerView` | Connects the page with the `Playlist`. No list logic. |

## The reordering bug this design avoids
If the player remembers the playing song as a **number** (its index), dragging a song changes which song that number points to. Example: `[A, B, C]`, B is playing (index 1). The user drags B to the start: `[B, A, C]`. With a stored index, `next()` goes to index 2 and plays **C**, skipping A.

Here the playing song is stored as a **node reference**. Moving a song only changes its links, the node object is the same, so B is still the current song, and `next()` plays **A**. This is covered by the test `BUG CASE` in `tests/Playlist.test.ts`.

## Run
```
npm install
npm run dev      # development
npm test         # unit tests
npm run build    # production build in dist/
```

## Deploy on Vercel
Import the GitHub repository in Vercel. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.

## Notes
- Files chosen from a computer are played from the browser memory of that tab. They are not uploaded to any server, so they disappear when the page is reloaded.
- Songs added by URL need a server that allows the browser to play them (most direct `.mp3` links do).
