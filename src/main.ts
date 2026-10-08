import "./style.css";
import { Playlist } from "./model/Playlist";
import { BrowserPlaylistStorage } from "./storage/BrowserPlaylistStorage";
import { PlaylistLibrary } from "./storage/PlaylistLibrary";
import { PlayerView } from "./ui/PlayerView";

new PlayerView(new Playlist(), new PlaylistLibrary(new BrowserPlaylistStorage()));
