
module Play {
    var currentSong: Heap<Music.MusicEvent>;
    var currTime: number;
    var song: string;
    var score: number;

    function playMusic(name: string, players: number) {
        currentSong = Music.loadSong(name, players);
        start();
    }

    function start() {
        var event = currentSong.pop();
    }
}

module Music {
    export function loadSong(name:string, players:number):Heap<MusicEvent> {
        return null;
    }

    export class MusicEvent {
        time: number;
        zone: number;
        color: Color.ColorData;

        constructor(time: number, zone: number, color: number) {
            this.time = time;
            this.zone = zone;
            this.color = Color.colors.apply(color);
        }

        static compare(a: MusicEvent, b: MusicEvent): number {
            return a.time - b.time;
        }
    }
}

module Color {
    export var colors: List<ColorData>;
    var colorSets: List<ColorData>;

    export function setupColors(setup: Queue<number>) {
        var colorList = new MutableList<ColorData>();
        for (var i = 0; i < setup.size(); i++) {
            colorList.insert(colorSets.apply(setup.dequeue()));
        }
        colors = colorList;
    }

    export class ColorData {
        r: number;
        g: number;
        b: number;

        constructor(r: number, g: number, b: number) {
            this.r = r;
            this.g = g;
            this.b = b;
        }
    }
}