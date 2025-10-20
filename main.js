var can = document.getElementById("canvas");
var ctx = can.getContext("2d");
can.width = window.innerWidth;
can.height = window.innerHeight;
var m = {x: can.width/2, y: can.height/2};

window.addEventListener("mousemove", function(event) {
    m.x = event.clientX;
    m.y = event.clientY;
});

window.addEventListener("touchmove", function(event) {
    m.x = event.touches[0].clientX;
    m.y = event.touches[0].clientY;
});

function distSqrd(x, y, x2, y2) {
    return ((x2 - x)**2 + (y2 - y)**2);
}

function Transition(startValue, endValue, type = "linear", duration, delay = 0) {
    this.start = startValue;
    this.end = endValue;
    this.duration = duration;
    this.delay = delay;
    this.type = type;
    this.done = false;
    this.startTime = Date.now();
    
    this.setValue = function(start, end, t = this.type, dur = this.duration, del = this.delay) {
        this.start = start;
        this.end = end;
        this.currentVal = start;
        this.duration = dur;
        this.delay = del;
        this.type = t;
        this.done = false;
        this.startTime = Date.now();
    };
    
    this.getCurrentTime = function() {
        return Date.now();
    };
    
    this.getElapsedTime = function() {
        return (this.getCurrentTime() - this.startTime)/1000;
    };
    
    this.giveValue = function() {
        var delta = this.end - this.start;
        var elapsed = (this.getElapsedTime() - this.delay)/this.duration;
        var timeFunction;
        
        switch(this.type) {
            case "easeOut":
                timeFunction = 1 - ((1 - elapsed) ** 4);
                break;
            case "easeInOut":
                (elapsed < 0.5) ? timeFunction = ((elapsed * 2) ** 4)/2 : timeFunction = (2 - (((1 - elapsed) * 2) ** 4))/2;
                break;
            case "easeOutBack":
                var j = 0.45;
                timeFunction = 1 - ((-2 * ((1 - elapsed) ** 3) + (3 * j) * ((1 - elapsed) ** 2))/(3 * j - 2));
                break;
            default:
                timeFunction = elapsed;
        }
        
        if(elapsed >= 1) {
            if(!this.done) this.done = true;
            return this.end;
        } else if(elapsed <= 0) {
            return this.start;
        }
        return this.start + delta * timeFunction;
    };
}

function Petal(x, y, ang, l, h, max, dur, del) {
    var transition = "easeInOut";
    this.scale = new Transition(-0.05, max, transition, dur, del);
    this.x = x;
    this.y = y;
    this.h = h;
    
    this.upd = function() {
        var size = this.scale.giveValue();
        ctx.lineWidth = 5;
        ctx.save();
        
        var grd = ctx.createLinearGradient(0, 0, l, 0);
        grd.addColorStop(0, "hsl(" + this.h + "," + ((size >= 0) ? 100 : 0) + "%,10%)");
        grd.addColorStop(1, "hsl(" + this.h + "," + ((size >= 0) ? 100 : 0) + "%," + (size >= 0 ? (10 + size * 50) : 20) + "%)");
        ctx.fillStyle = grd;
        
        ctx.translate(this.x, this.y);
        ctx.rotate(ang);
        ctx.scale((size <= 1) ? size : (-size + 2), 1);
        
        ctx.beginPath();
        ctx.moveTo(0, -l/20);
        ctx.quadraticCurveTo(3 * l/4, -l/3, l, 0);
        ctx.quadraticCurveTo(3 * l/4, l/3, 0, l/20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };
}

function Flower(x, y, h, petalDur) {
    this.num = 8;
    this.layers = 6;
    this.h = h;
    this.inside = false;
    var random = 0.11;
    var delayMult = 0.08;
    this.bloomDur = (random + (this.layers-1)*delayMult) + petalDur;
    this.canChange = false;
    setTimeout(() => {
        this.canChange = true;
        // Hiện message khi hoa nở xong lần đầu
        if(messageContainer) {
            messageContainer.style.opacity = '1';
        }
    }, this.bloomDur*1000);
    this.ready = false;
    this.rad = Math.min(can.width, can.height)/12;
    var innerRad = this.rad/3;
    this.petals = [];
    
    for(var j = 0; j < this.layers; j++) {
        for(var i = 0; i < this.num; i++) {
            var angle = i * 2 * Math.PI/this.num + j * 0.3;
            var setRad = this.rad + (innerRad - this.rad) * j/(this.layers-1);
            var del = Math.random()*random + j*delayMult;
            var hue = h;
            this.petals.push(new Petal(x + Math.cos(angle)*setRad, y + Math.sin(angle)*setRad, angle, setRad*4, hue, 0.3 + (1-0.3)*(this.layers-1-j)/(this.layers-1), petalDur, del));
        }
    }
    
    var st = Date.now();
    
    this.changeOnMouse = function() {
        if(distSqrd(x, y, m.x, m.y) <= (this.rad + 10)**2 && this.canChange) {
            for(var j = 0; j < this.layers; j++) {
                for(var i = 0; i < this.num; i++) {
                    var index = j*this.num + i;
                    var del = (random + (this.layers-1)*delayMult) - this.petals[index].scale.delay;
                    this.petals[index].scale.setValue(this.petals[index].scale.end, this.petals[index].scale.start, "easeOut", petalDur, del);
                }
            }
            this.canChange = false;
            st = Date.now();
            createHearts(x, y);

            // Ẩn message khi hoa khép lại
            if(messageContainer) {
                messageContainer.style.opacity = '0';
            }
        }

        if((Date.now() - st)/1000 > this.bloomDur && !this.canChange) {
            this.ready = true;
        }

        if(distSqrd(x, y, m.x, m.y) > (this.rad + 10)**2 && this.ready) {
            this.ready = false;
            this.canChange = true;

            // Hiện message khi hoa nở lại
            if(messageContainer) {
                messageContainer.style.opacity = '1';
            }
        }
    };
    
    this.upd = function() {
        ctx.fillStyle = "hsl(" + h + ",100%,10%)";
        ctx.beginPath();
        ctx.arc(x, y, this.rad, 0, 2*Math.PI);
        ctx.fill();
        this.changeOnMouse();
    };
}

function createHearts(x, y) {
    for(let i = 0; i < 5; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '❤️';
            heart.style.left = (x + (Math.random() - 0.5) * 100) + 'px';
            heart.style.top = y + 'px';
            heart.style.animationDelay = '0s';
            heart.style.animationDuration = (3 + Math.random() * 2) + 's';
            document.body.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 5000);
        }, i * 100);
    }
}

var tulip;
var messageContainer;

function setup() {
    tulip = new Flower(can.width/2, can.height/2, 340, 1);
    messageContainer = document.querySelector('.message-container');
}

function anim() {
    ctx.clearRect(0, 0, can.width, can.height);
    
    tulip.upd();
    var l = tulip.petals.length;
    for(var i = 0; i < l; i++) {
        tulip.petals[i].upd();
    }
    
    requestAnimationFrame(anim);
}

window.onload = function() {
    setup();
    anim();
};