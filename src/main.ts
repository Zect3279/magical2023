import p5 from 'p5'
import { Player, Ease } from "textalive-app-api";

import observe from "./util/utils"

type CirclePose = {
  x: number
  y: number
  life: number
}
type NotesObj = {
  id: number
  text: string
  startTime: number
  endTime: number
  NstartTime: number
  NendTime: number
  ppos: number
  z: number
  xType: number
  color?: string
  type: string
}

var endLoad = false
const SONG_URL = "https://piapro.jp/t/ucgN/20230110005414"
var chorus_data:any;
let notes: NotesObj[] = []
const noteSpeed = 1
const noteSize = 25

const sketch = (p: p5) => {
  let font: p5.Font
  let objects: Array<CirclePose> = []

  p.preload = () => {
    font = p.loadFont("/ZenOldMincho-Medium.ttf")
  }

  p.setup = () => {
    console.log(p.windowWidth)
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL)
    // p.drawingContext.disable(p.drawingContext.DEPTH_TEST)
    p.textFont(font)
    p.textAlign(p.CENTER, p.CENTER)
    p.textSize(50)
    p.angleMode(p.DEGREES)
    p.rectMode(p.CENTER)
    p.frameRate(60)
    // p.noStroke()
  }

  p.draw = () => {
    const centerY = p.height * 0.6 / 2
    // p.translate(p.width/2, p.height/2)
    if (endLoad && !player.isPlaying) {
      p.background(50)
      p.textSize(50)
      p.fill(255)
      p.text(player.data.song.name, 0, -20)
      p.textSize(30)
      p.text(`by ${player.data.song.artist.name}`, 0, 40)
      p.textSize(20)
      p.text("画面をクリックして開始", 0, 120)

      p.push()

      p.translate(0, centerY)
      p.rotateX(60)
      // p.translate(0,0)

      const posX = (i: number) => p.map(i, 0, 8, -p.width*0.9/2, p.width*0.9/2)

      for (let i = 0; i <= 8; i++) {
        p.line(posX(i), -p.height*2, posX(i), p.height/2)
      }

      // p.line(-p.width/2, -10, p.width/2, -10)
      p.line(-p.width/2, 0, p.width/2, 0)
      // p.line(-p.width/2, 10, p.width/2, 10)

      //
      p.pop()
    } else if (player.isPlaying && chorus_data) {
      p.background(0)
      p.textSize(50)
      p.fill(255)
      const position = player.timer.position
      let phrases = []
      let phraseStart = 0
      let phraseEnd = 0
      for (const phrase of player.video.phrases) {
        if (phrase.startTime <= position && position <= phrase.endTime) {
          phraseStart = phrase.startTime
          phraseEnd = phrase.endTime
        }
      }
      for (const n of notes) {
        if (phraseStart <= n.startTime && n.endTime <= phraseEnd) {
          phrases.push({"text": n.text, "color": n.color})
        }
      }
      let lylicBase: string = ""
      const alphabetPattern = /^[A-Za-z]+$/
      for (const [i, p] of phrases.entries()) {
        if (alphabetPattern.test(p.text) && alphabetPattern.test(phrases[i+1]?.text)) {
          lylicBase += `${p.text} `
          p.text += ' '
        } else {
          lylicBase += `${p.text}`
        }
      }
      p.text(lylicBase, 0, -140)

      let textWidth = 0
      for (let i = 0; i < lylicBase.length; i++) {
        textWidth += p.textWidth(lylicBase[i])
      }
      p.push()
      p.textAlign(p.LEFT)
      let currentPos = -textWidth/2
      for (const phrase of phrases) {
        p.push()
        if (phrase.color !== undefined) {
          p.fill(phrase.color)
        }
        p.text(phrase.text, currentPos, 120)
        p.pop()
        currentPos += p.textWidth(phrase.text)
      }
      p.pop()


      for (const s of chorus_data["repeatSegments"]) {
        for (const r of s["repeats"]) {
          if (r["start"] <= position && position < (r["start"] + r["duration"])) {
            if (s["isChorus"]) {
              p.text("サビ", 0, -230)
            } else {
              p.text(`${s["index"]}-${r["index"]}`, 0, -230)
            }
          }
        }
      }

      p.push()
      p.stroke(255)

      p.translate(0, centerY)
      p.rotateX(60)
      // p.translate(0,0)

      const posX = (i: number) => p.map(i, 0, 8, -p.width*0.9/2, p.width*0.9/2)

      for (let i = 0; i <= 8; i++) {
        p.line(posX(i), -p.height*2, posX(i), p.height/2)
      }

      // p.line(-p.width/2, -10, p.width/2, -10)
      p.line(-p.width/2, 0, p.width/2, 0)
      // p.line(-p.width/2, 10, p.width/2, 10)

      notes.forEach((n: NotesObj) => {
        if (n.NstartTime <= position && position <= n.NendTime) {
          if (n.ppos-10 <= position && position <= n.ppos+10) { console.log(n.text) }
          const posY
          = p.map(position, n.NstartTime, n.NendTime, -p.height*2, p.height*2)
          p.circle(posX(n.xType), posY, noteSize)
        }
      })

      //
      p.pop()

      for (const b of player.getBeats()) {
        if (b.startTime <= position && position < b.endTime) {
          p.text(b.index, 0, -320)
        }
      }

    }

    // クリック場所に円
    objects.forEach((object) => {
      let alpha = p.map(object.life, 0, 500, 0, 255);
      p.fill(255, alpha);
      p.noStroke();
      p.circle(object.x, object.y, 20);
      object.life -= p.deltaTime;
    });

    objects = objects.filter((object) => object.life > 0);
  }

  p.mousePressed = () => {
    if (!(player.isPlaying && chorus_data)) {
      return
    }
    const x = p.mouseX - p.width / 2
    const y = p.mouseY - p.height / 2
    const position = player.timer.position

    objects.push({ x: x, y: y, life: 500 })

    notes.forEach((n) => {
      const posY = p.map(position, n.NstartTime, n.NendTime, -p.height*2, p.height*2)
      if (!(-50 <= posY && posY <= 50)) {
        return
      }
      console.log(n.text)
      //TODO Miss判定 Bad判定
      if ((-100 <= posY && posY < -60) || (60 < posY && posY <= 100)) {
        // Good判定
        console.log("good")
        n.color="rgb(0, 256, 0)" // green
      } else if ((-60 <= posY && posY < 30) || (30 < posY && posY <= 60)) {
        // Great判定
        console.log("great")
        n.color="rgb(0, 0, 256)" // blue
      } else if (-30 <= posY && posY <= 30) {
        // Perfect判定
        console.log("perfect")
        n.color="rgb(256, 0, 0)" // red
      }
    })
    // prevent default
    return false;
  }
}

new p5(sketch)

const player = new Player({
  app: { token: "xaE5okcYELClyrkD" },
  mediaElement: document.querySelector("#media") as HTMLMediaElement,
})

function getRandomLylicX(seed: number): number {
  const max = 7;
  const randomSeed = (seed * 4364 + 85628) % 294628;
  const randomNumber = Math.floor(randomSeed / 294628 * (max + 1));
  return randomNumber;
}

// クオンタイズ：
//   歌詞のタイミングをビートでクオンタイズ
//   upper: ビート
//   input: 歌詞
// function quantizeValue(lowerValue: number, upperValues: number[]): number {
//   let quantizedValue = lowerValue;
//   let j = 0;
//   while (quantizedValue > upperValues[j]) { j++; }
//   if (j > 0) {
//     const diff1 = quantizedValue - upperValues[j - 1];
//     const diff2 = upperValues[j] - quantizedValue;
//     quantizedValue = diff1 < diff2 ? upperValues[j - 1] : upperValues[j];
//   } else {
//     quantizedValue = upperValues[j];
//   }
//   return quantizedValue;
// }

function quantizeValue(value: number, array: number[]): number {
  // console.log(value)
  // console.log(array.length)
  // const value = 100; // 調べたい値
  // const array = [1, 123, 13, 84, 255, 3, 136, 96, 117, 62]; // 調べたい配列
  const diff: number[] = [];
  let index = 0;

  array.forEach((val: number, i) => {
    diff[i] = Math.abs(value - val);
    index = diff[index] < diff[i] ? index : i;
  });
  return array[index]
}

function divideList(list: number[]): number[] {
  let output: number[] = [];
  list.forEach((b, i) => {
    if (i == list.length) { output.push(b) }
    else {
      output.push(b)
      output.push((list[i] + list[i+1])/2)
    }
  })
  return output;
}

// クオンタイズがダメっぽい
function createNotesFromLylic() {
  console.log(player.getBeats()[0].duration *2)

  const beats: number[] = []
  player.getBeats().forEach((b) => { beats.push(b.startTime) })
  console.log(beats.slice(0,5))
  const halfBeats = divideList(beats)
  console.log(halfBeats.slice(0,10))

  for (const phrase of player.video.phrases) {
    for (const word of phrase.children) {
      if (word.duration >= player.getBeats()[0].duration *2) {
        for (const char of word.children) {
          // const startTime: number = quantizeValue(char.startTime, beats)
          const startTime: number = quantizeValue(char.startTime, halfBeats)
          console.log(startTime)
          // const startTime = char.startTime
          notes.push({
            "id": Number(new Date().getTime().toString().slice(-7)),
            "text": char.text,
            "startTime": char.startTime,
            "endTime": char.endTime,
            "NstartTime": startTime - 1000*noteSpeed,
            "NendTime": startTime + 1000*noteSpeed,
            "ppos": startTime,
            "z": -1000,
            "xType": getRandomLylicX(startTime),
            "type": "char"
          })
        }
      } else {
        // const startTime = quantizeValue(word.startTime, beats)
        const startTime = quantizeValue(word.startTime, halfBeats)
        // const startTime = word.startTime
        notes.push({
          "id": Number(new Date().getTime().toString().slice(-7)),
          "text": word.text,
          "startTime": word.startTime,
          "endTime": word.endTime,
          "NstartTime": startTime - 1000*noteSpeed,
          "NendTime": startTime + 1000*noteSpeed,
          "ppos": startTime,
          "z": -1000,
          "xType": getRandomLylicX(startTime),
          "type": "word"
        })
      }
    }
  }
}
function createNotesFromBeat() {
  // ビートに合わせたノート作成
  for (const b of player.getBeats()) {
    notes.push({
      "id": Number(new Date().getTime().toString().slice(-7)),
      "startTime": b.startTime,
      "endTime": b.endTime,
      "ppos": b.startTime,
      "z": -1000,
      "xType": getRandomLylicX(b.startTime),
    })
  }
}
player.addListener({
  onAppReady: (app) => {
    if (!app.managed) {
      player.createFromSongUrl(SONG_URL, {
        video: {
          // 音楽地図訂正履歴: https://songle.jp/songs/2427948/history
          beatId: 4267297,
          chordId: 2405019,
          repetitiveSegmentId: 2405019,
          // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FucgN%2F20230110005414
          lyricId: 56092,
          // lyricDiffId: 10701
          lyricDiffId: 9636
        },
      })
    }
  },
  onTimerReady() {
    // ↓サビ飛ばし
    player.requestMediaSeek(35000)
    // player.requestMediaSeek(239540)
    console.log(player.data.song)
    endLoad = true
    // https://widget.songle.jp/api/v1/song/chorus.json?url=https://piapro.jp/t/ucgN/20230110005414
    const url = "https://widget.songle.jp/api/v1/song/chorus.json?url=" + SONG_URL
    console.log(url)
    fetch(url)
      .then(response => response.json())
      .then(data => chorus_data = data)
    // console.log(chorus_data)
    function clickHandler(event: MouseEvent) {
      if (player.isPlaying) {
        return
      }
      // createNotesFromBeat();
      createNotesFromLylic();

      player.requestPlay();
      // document.removeEventListener('click', clickHandler);
    }
    document.addEventListener('click', clickHandler);
  },
  onDispose() {
      console.log("end from dispose")
  },
  onStop() {
      console.log("end from stop")
  },
})
