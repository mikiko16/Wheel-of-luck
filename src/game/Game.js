import gsap from "gsap";

export class Game {
    constructor(app, resources, config) {
        this.app = app;
        this.resources = resources;
        this.config = config
        this.isSpinning = false;
        this.spinCount = 0;
        this.freeSpinsRemaining = 0;
        this.totalFreeSpinWin = 0;
        this.currentWin = 0;
        this.previousSegment = null;
        this.freeSpinInterval = null;
        this.finalFreeSpin = false;
    }

    setup() {
        this.wheel = new PIXI.Sprite(this.resources['assets/wheel.png'].texture);
        this.wheel.anchor.set(0.5);
        this.wheel.x = this.app.screen.width / 2;
        this.wheel.y = this.app.screen.height / 2;
        this.app.stage.addChild(this.wheel);

        this.arrow = new PIXI.Sprite(this.resources['assets/arrow.png'].texture);
        this.arrow.anchor.set(0.5, 1);
        this.arrow.x = this.app.screen.width / 2;
        this.arrow.y = this.app.screen.height / 2 - this.wheel.height / 2;
        this.app.stage.addChild(this.arrow);

        this.button = new PIXI.Sprite(this.resources['assets/btnStart.png'].texture);
        this.button.anchor.set(0.5);
        this.button.x = this.app.screen.width / 2;
        this.button.y = this.app.screen.height / 2;
        this.button.interactive = true;
        this.button.buttonMode = true;
        this.button.on('pointerdown', () => this.spinWheel());
        this.app.stage.addChild(this.button);

        this.sectorsContainer = new PIXI.Container();
        this.sectorsContainer.x = this.wheel.x;
        this.sectorsContainer.y = this.wheel.y;
        this.app.stage.addChild(this.sectorsContainer);

        this.addNumbersAroundWheel(this.config.segments);

        this.winText = new PIXI.Text("Печалба: 0", {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xffffff,
            align: 'left'
        });
        this.winText.x = 10;
        this.winText.y = 10;
        this.app.stage.addChild(this.winText);
    }

    addNumbersAroundWheel(segments) {
        const radius = this.wheel.width / 3;
        const angleStep = 360 / segments;

        this.numbers = [];

        for (let i = 0; i < segments; i++) {
            const angle = angleStep * i;
            const numberX = Math.cos((angle - 90) * Math.PI / 180) * radius;
            const numberY = Math.sin((angle - 90) * Math.PI / 180) * radius;

            const numberText = new PIXI.Text(i === 15 ? "FreeSpin" : `${i + 1}`, { 
                fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' 
            });
            numberText.anchor.set(0.5);
            numberText.x = numberX;
            numberText.y = numberY;

            this.sectorsContainer.addChild(numberText);
            this.numbers.push(numberText);
        }
    }

    updateWinText() {
        let text = `Текуща печалба: ${this.currentWin}`;

        if (this.freeSpinsRemaining > 0 || (this.freeSpinsRemaining === 0 && this.finalFreeSpin)) {
            text += `\nFreeSpins: ${this.freeSpinsRemaining} оставащи\nОбща печалба от FreeSpin: ${this.totalFreeSpinWin}`;
        } else if (this.totalFreeSpinWin > 0 || (this.freeSpinsRemaining === 0 && this.finalFreeSpin)) {
            text += `\nОбща печалба от FreeSpin: ${this.totalFreeSpinWin}`;
        }

        this.winText.text = text;
    }

    spinWheel() {
        if (this.isSpinning && this.freeSpinsRemaining === 0) return;

        this.isSpinning = true;
        let chosenSegment = this.chooseSegment(this.config.segments);

        const extraRotations = 4;
        const targetRotation = extraRotations * 360 + chosenSegment * (360 / this.config.segments);

        this.wheel.rotation = 0;
        this.sectorsContainer.rotation = 0;

        gsap.to(this.wheel, {
            rotation: targetRotation * Math.PI / 180,
            duration: 5,
            ease: "power3.out",
            onComplete: () => {
                this.isSpinning = false;
                this.handleSpinResult(chosenSegment);

                if (this.finalFreeSpin) {
                    this.showFreeSpinResult();
                    this.finalFreeSpin = false;
                }
            }
        });

        gsap.to(this.sectorsContainer, {
            rotation: targetRotation * Math.PI / 180,
            duration: 5,
            ease: "power3.out"
        });

        this.spinCount++;
    }

    chooseSegment(segments) {
        let segment;
        if (this.spinCount < 10) {
            if (this.config.repeatedSpinTracker.main < this.config.repeatedSpinCounts.main && (this.previousSegment !== this.config.repeatedSectors.main)) {
                segment = this.config.repeatedSectors.main;
                this.config.repeatedSpinTracker.main++;
            } else if (this.config.repeatedSpinTracker.secondary < this.config.repeatedSpinCounts.secondary && (this.config.previousSegment !== this.config.repeatedSectors.secondary)) {
                segment = this.config.repeatedSectors.secondary;
                this.config.repeatedSpinTracker.secondary++;
            } else {
                segment = Math.floor(Math.random() * segments);
            }
        } else {
            segment = Math.floor(Math.random() * segments);
        }

        if (segment === this.previousSegment) {
            segment = (segment + 1) % segments;
        }

        this.previousSegment = segment;
        return segment;
    }

    handleSpinResult(segment) {
        const results = Array.from({ length: this.config.segments }, (_, i) => `Награда ${i + 1}`);
        results[15] = "FreeSpin";

        const adjustedSegment = (this.config.segments - segment) % this.config.segments;
        if (results[adjustedSegment] === "FreeSpin") {
            this.activateFreeSpins();
        } else {
            let win = parseInt(results[adjustedSegment].split(" ")[1], 10);
            this.currentWin = win;
            if (this.freeSpinsRemaining > 0 || (this.freeSpinsRemaining === 0 && this.finalFreeSpin)) {
                this.updateTotalFreeSpinWin(win);
            }
            this.updateWinText();
            console.log("Ти спечели: " + results[adjustedSegment]);
        }
    }

    activateFreeSpins() {
        console.log("Попаднахте на 'FreeSpin'! Започваме автоматичните завъртания...");
        this.freeSpinsRemaining = 3;
        this.totalFreeSpinWin = 0;
        this.currentWin = 0;
        this.updateWinText();
        this.button.interactive = false

        this.freeSpinInterval = setInterval(() => {
            if (this.freeSpinsRemaining > 0) {
                this.spinWheel();
                this.freeSpinsRemaining--;
                if (this.freeSpinsRemaining === 0) {
                    this.finalFreeSpin = true;
                    this.button.interactive = true
                }
            } else {
                clearInterval(this.freeSpinInterval);
                if (!this.isSpinning) {
                    this.showFreeSpinResult();
                }
            }
        }, 6000);
    }

    updateTotalFreeSpinWin(win) {
        this.totalFreeSpinWin += win;
        this.updateWinText();
    }

    showFreeSpinResult() {
        this.currentWin = this.totalFreeSpinWin;
        this.updateWinText();
        this.totalFreeSpinWin = 0;
    }
}
