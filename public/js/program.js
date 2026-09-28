// Training program data for Harvell (U10) and Jasper (U14).
// Each item: I(name, seconds, cue, {r: rest s, x: sets, L: left+right, t: kind, dirs, ch, test})

export function I(n, s, c, o){ o = o || {}; return {n:n, s:s, c:c||"", r:o.r||0, x:o.x||1, L:!!o.L, t:o.t||null, dirs:o.dirs||null, ch:o.ch||null, test:o.test||null}; }

export const CHALLENGES = {
  hotspot60:{label:"Hot Spot 60", unit:"makes", max:40, how:"Makes in 60 s from the block. Get your own rebound."},
  mikan60:{label:"Mikan Minute", unit:"makes", max:50, how:"Makes in 60 s, alternating hands under the rim."},
  ft10:{label:"Free Throw 10", unit:"of 10", max:10, how:"Shoot 10 free throws. Count the makes."},
  atw10:{label:"Around the World", unit:"of 10", max:10, how:"2 shots at each of 5 close spots. Makes out of 10."},
  btp11:{label:"Beat the Pro", unit:"points", max:11, how:"Make = 1 point for you. Miss = 2 for the Pro. First to 11. Enter your points (11 = you won)."},
  corner60:{label:"Corner 60", unit:"makes", max:40, how:"Makes in 60 s from one corner. Get your own rebound."},
  ft20:{label:"Free Throw 20", unit:"of 20", max:20, how:"Shoot 20 free throws. Count the makes."},
  spot25:{label:"5-Spot 25", unit:"of 25", max:25, how:"5 shots from each of 5 spots. Makes out of 25."}
};
export const TESTS = {
  harvell:[
    {id:"broad", label:"Broad jump", unit:"cm", max:400, how:"Best of 3. Line to back heel."},
    {id:"slides", label:"Slide test", unit:"touches", max:60, how:"Lines 3 m apart. Touches in 30 s."},
    {id:"plank", label:"Plank hold", unit:"sec", max:90, how:"Max 90 s."}
  ],
  jasper:[
    {id:"broad", label:"Broad jump", unit:"cm", max:400, how:"Best of 3. Line to back heel."},
    {id:"slides", label:"Slide test", unit:"touches", max:60, how:"Lane width (4.9 m). Touches in 30 s."},
    {id:"plank", label:"Plank hold", unit:"sec", max:120, how:"Max 120 s."}
  ]
};

export const HANDLES = [
  I("W1 Fingertip Taps",30,"Quick taps, overhead down to your knees and back."),
  I("W2 Around the World",30,"Head, waist, knees, then back up. Switch direction halfway."),
  I("W3 Figure 8 Wraps",30,"Around and through both legs, no dribble. Switch halfway."),
  I("W4 Drop & Catch",30,"One hand in front, one behind your legs. Drop, switch hands, catch before it lands."),
  I("01 Pound · Right",30,"As hard as you can, 45° in front of your right foot. Knee height or lower."),
  I("02 Pound · Left",30,"Same power on the left. Eyes forward."),
  I("03 Side-to-Side · Right",30,"One hand. Push the ball side to side in front of you."),
  I("04 Side-to-Side · Left",30,"Right arm up to protect the ball."),
  I("05 Crossover",30,"Find the rhythm. Tight, then wide."),
  I("06 Behind the Back",30,"Stay low. Keep it below the knee."),
  I("07 Figure 8 · Backward",30,"Through the legs, front to back."),
  I("08 Figure 8 · Forward",30,"Back to front. The hand switch is the hard part."),
  I("09 Cross–Between–Behind",60,"One full minute. Mess up? Pick up where you left off.")
];

const STRETCH_CUE = "Calves, hamstrings, hips, quads. Slow breaths, no bouncing.";

export const PROGRAM = {
  harvell:{
    name:"Harvell", group:"U10", sleep:"9–12 hours",
    warmup:[
      I("Jog & skip",45,"Jog forward, then skip. Swing your arms."),
      I("Shuffle & carioca",45,"Side shuffle one way, carioca back."),
      I("Lunge + twist",30,"Step, drop the back knee, turn toward the front leg."),
      I("Balance: ball around waist",30,"Stand on one leg and pass the ball around your waist.",{L:true}),
      I("Squat jump & stick",30,"About 5 jumps. Land soft, knees over toes, freeze 2 s."),
      I("Plank shoulder taps",30,"Hips still. Tap left, tap right."),
      I("Glute bridge",30,"Squeeze your glutes at the top."),
      I("Build-up runs",30,"Two 10 m runs, easy to fast.")
    ],
    days:{
      mon:{
        athletic:{title:"Speed & Agility", items:[
          I("Fast feet on a line",20,"Tiny, quick steps over and back across a line.",{x:3,r:20}),
          I("Reaction starts",60,"Walk around. On every GO, sprint 5 m. Walk back.",{t:"reaction"}),
          I("Cone zig-zag",30,"4 cones in a zig-zag. Sprint, plant, cut.",{x:2,r:30}),
          I("Shuttle 5-10-5",20,"3 lines, 5 m apart. Right, left, back through the middle.",{x:3,r:40})
        ]},
        strength:{title:"Upper Body + Core", items:[
          I("Incline push-ups",30,"Hands on a bench. Body straight like a plank.",{x:2,r:20}),
          I("Bear crawl",30,"Knees just off the floor. Crawl forward and back.",{x:2,r:20}),
          I("Plank",20,"Elbows under shoulders. Squeeze everything.",{x:2,r:15}),
          I("Dead bug",30,"Low back glued to the floor. Opposite arm and leg.",{x:2,r:20}),
          I("Stretch",50,STRETCH_CUE)
        ]},
        skill:{title:"Form & Feel", ch:"hotspot60", items:[
          I("One-hand form shots",120,"1 m from the rim. Guide hand behind your back. Hold the follow-through."),
          I("Form shots, 3 spots",180,"2 m out: left, middle, right. 5 makes, then move."),
          I("Bank shots",180,"From the block, aim at the top corner of the box. Both sides."),
          I("Get ready",60,"Grab your ball and stand on the block.",{t:"rest"}),
          I("CHALLENGE · Hot Spot 60",60,"Makes in 60 s from the block. Count out loud!",{t:"challenge", ch:"hotspot60"})
        ]}
      },
      tue:{
        athletic:{title:"Jump & Land", items:[
          I("Snap-downs",30,"Up on your toes, arms high, then snap into a quiet landing. No jump.",{r:30}),
          I("Pogo hops",10,"Stiff ankles. Bounce fast on the balls of your feet.",{x:2,r:20}),
          I("Squat jump & stick",30,"About 5 jumps. Land soft, freeze 2 s.",{x:2,r:30}),
          I("Line hops",15,"Two feet, forward and back over a line.",{x:2,r:25}),
          I("Broad jump & stick",60,"4 jumps. Swing your arms, jump far, stick the landing.",{r:40}),
          I("Single-leg hop & stick",30,"Small hop forward on one leg, hold 3 s. 3 hops.",{L:true})
        ]},
        strength:{title:"Legs", items:[
          I("Slow squats",30,"3 seconds down, stand up tall.",{x:2,r:20}),
          I("Reverse lunges",30,"Alternate legs. Front knee over the toes.",{x:2,r:20}),
          I("Glute bridge",30,"Push through your heels, squeeze at the top.",{x:2,r:20}),
          I("Calf raises",30,"Up on your toes, slow down.",{r:15}),
          I("Stretch",75,STRETCH_CUE)
        ]},
        skill:{title:"Finish Strong", ch:"mikan60", items:[
          I("Mikan drill",120,"Right hand, left hand, under the rim. Keep the ball high."),
          I("Right-hand layups",120,"Take off from your left foot, right knee up."),
          I("Left-hand layups",120,"Take off from your right foot, left knee up."),
          I("Jump-stop power finish",120,"Dribble in, two-foot jump stop, chin the ball, go up strong."),
          I("Get ready",60,"Stand under the rim with your ball.",{t:"rest"}),
          I("CHALLENGE · Mikan Minute",60,"Makes in 60 s. Alternate hands.",{t:"challenge", ch:"mikan60"})
        ]}
      },
      wed:{
        athletic:{title:"Defense Footwork", items:[
          I("Defensive stance hold",20,"Feet wide, hips down, back flat, hands active.",{x:2,r:20}),
          I("Slides line to line",20,"3–4 m. Push off, don't click your heels, stay low.",{x:3,r:20}),
          I("Zig-zag slides",30,"Slide on a diagonal, drop step, slide the other way.",{x:2,r:30}),
          I("Closeout & chop",20,"Sprint 3 steps, chop short steps, one hand high.",{x:3,r:20}),
          I("Arrow slides",40,"Slide the way the arrow points. Stay low the whole time.",{t:"arrows", dirs:["left","right"]})
        ]},
        strength:{title:"Core & Balance", items:[
          I("Side plank",20,"Straight line from head to feet.",{L:true,x:2,r:20}),
          I("Bird dog",30,"Opposite arm and leg long. Slow.",{x:2,r:15}),
          I("Balance: ball around waist",30,"One leg. Keep your hips level.",{L:true}),
          I("Superman hold",20,"Lift arms and legs, look at the floor.",{x:2,r:15}),
          I("Stretch",80,STRETCH_CUE)
        ]},
        skill:{title:"Footwork + Free Throws", ch:"ft10", items:[
          I("Jump stop & pivots",120,"Jump stop, front pivot, reverse pivot. Ball chinned."),
          I("Triple-threat jabs",120,"Jab, jab, shot fake. Keep your pivot foot down."),
          I("Catch, pivot, shoot",120,"Spin the ball out, catch on a jump stop, pivot, shoot close."),
          I("Free-throw routine",120,"Same routine every time: dribbles, breath, shoot."),
          I("CHALLENGE · Free Throw 10",120,"Shoot 10. Count your makes.",{t:"challenge", ch:"ft10"})
        ]}
      },
      thu:{
        athletic:{title:"Speed & First Step", items:[
          I("Wall drive switches",20,"Lean into a wall, drive a knee up, switch fast.",{x:2,r:20}),
          I("Falling starts",30,"Lean until you almost fall, then sprint 5 m. 2 per set.",{x:2,r:30}),
          I("Arrow sprints",60,"Sprint 3 m the way the arrow points, back to the middle.",{t:"arrows", dirs:["left","right","up"]}),
          I("Crossover-step start",30,"Turn your hips, cross over, sprint 5 m. Both sides.",{x:2,r:30}),
          I("Line touch race",20,"Touch 3 lines and come back, as fast as you can.",{x:2,r:30})
        ]},
        strength:{title:"Full Body", items:[
          I("Push-ups",30,"Knees down is fine. Chest to the floor.",{x:2,r:20}),
          I("Superman W-raise",30,"On your belly, lift your chest, squeeze your shoulder blades.",{x:2,r:20}),
          I("Split squat",30,"Back knee drops straight down.",{L:true,r:20}),
          I("Tuck hollow hold",20,"Low back pressed down, knees tucked.",{x:2,r:15}),
          I("Stretch",70,STRETCH_CUE)
        ]},
        skill:{title:"Around the World", ch:"atw10", items:[
          I("5-spot shots, close",180,"2–3 m around the rim. 3 makes at each spot."),
          I("One-dribble pull-up",150,"One hard dribble, jump stop, shoot."),
          I("Weak-hand form shots",150,"Close to the rim, weak hand only."),
          I("CHALLENGE · Around the World",120,"2 shots at each of 5 spots. Makes out of 10.",{t:"challenge", ch:"atw10"})
        ]}
      },
      fri:{
        athletic:{title:"Jump + Test Day", test:true, items:[
          I("Pogo hops",10,"Stiff ankles. Bounce fast.",{x:2,r:20}),
          I("Squat jump & stick",30,"About 5 jumps. Freeze every landing.",{x:2,r:30}),
          I("TEST · Broad jump",90,"3 tries. Measure line to back heel. Remember your best.",{test:"broad"}),
          I("TEST · Slide test",30,"Lines 3 m apart. Count line touches in 30 s.",{test:"slides", r:60}),
          I("TEST · Plank hold",90,"Hold as long as you can. Note your time.",{test:"plank", r:30})
        ]},
        strength:{title:"Recover", items:[
          I("Wall sit",30,"Thighs level with the floor.",{r:30}),
          I("Crab walk",30,"Hips up. Forward and back.",{x:2,r:20}),
          I("Slow mountain climbers",20,"Knee to chest, hips low.",{x:2,r:20}),
          I("Stretch & breathe",180,STRETCH_CUE)
        ]},
        skill:{title:"Game Day", ch:"btp11", items:[
          I("Warm-up shots",120,"Close shots, both hands."),
          I("Layups, both hands",120,"Right side right hand, left side left hand."),
          I("Your favorite spots",120,"Game speed. Shoot like it's a real game."),
          I("CHALLENGE · Beat the Pro",240,"Make = 1 for you. Miss = 2 for the Pro. First to 11.",{t:"challenge", ch:"btp11"})
        ]}
      }
    }
  },
  jasper:{
    name:"Jasper", group:"U14", sleep:"8–10 hours",
    warmup:[
      I("Jog, skip & backpedal",45,"Jog, skip, then backpedal. Stay light."),
      I("Shuffle & carioca",45,"Side shuffle one way, carioca back."),
      I("3-D lunge",30,"Lunge forward, sideways, back. Knee tracks over the toes."),
      I("Balance: wall toss",30,"On one leg, toss the ball off a wall and catch it.",{L:true}),
      I("Skater hop & stick",30,"Hop sideways, land on one leg, hold 2 s."),
      I("Plank shoulder taps",30,"Hips still. Tap left, tap right."),
      I("Nordic hamstring",30,"Feet hooked under a couch. Lower slowly, 3 reps."),
      I("Build-up runs",30,"Two 15 m runs, easy to fast.")
    ],
    days:{
      mon:{
        athletic:{title:"Speed & Agility", items:[
          I("In-and-out fast feet",20,"Both feet in, both out of a line. Fast and light.",{x:3,r:20}),
          I("Reaction starts",60,"Walk around. On every GO, sprint 10 m. Walk back.",{t:"reaction"}),
          I("Sprint & stop",30,"Sprint 10 m, stop in two steps, hold your stance 2 s.",{x:2,r:30}),
          I("Pro agility 5-10-5",20,"Full speed. Touch each line with your hand.",{x:3,r:40})
        ]},
        strength:{title:"Upper Body + Core", items:[
          I("Tempo push-ups",40,"3 seconds down, 1 second up.",{x:2,r:20}),
          I("Pike push-ups",30,"Hips high, lower your head toward the floor.",{x:2,r:20}),
          I("Plank",45,"Squeeze glutes and abs. No sagging.",{r:15}),
          I("Plank shoulder taps",30,"Hips still.",{r:15}),
          I("Dead bug",40,"Low back glued down. Slow.",{r:20}),
          I("Stretch",35,STRETCH_CUE)
        ]},
        skill:{title:"Catch & Shoot", ch:"corner60", items:[
          I("One-hand form shots",90,"Close to the rim. Perfect finish, hold it."),
          I("1-2 step catch & shoot",150,"Spin the ball out, step in, rise, shoot. Elbows and wings."),
          I("Corner shots",150,"Both corners. Three if your form holds, long two if not."),
          I("Elbow jumpers",90,"Both elbows. Same shot every time."),
          I("Get ready",60,"Go to your corner with the ball.",{t:"rest"}),
          I("CHALLENGE · Corner 60",60,"Makes in 60 s from one corner. Own rebound.",{t:"challenge", ch:"corner60"})
        ]}
      },
      tue:{
        athletic:{title:"Jump & Land", items:[
          I("Snap-down to drop squat",30,"Snap into a deep, quiet landing.",{r:10}),
          I("Pogo hops",15,"Stiff ankles, fast off the floor.",{x:2,r:15}),
          I("Countermovement jump & stick",30,"5 max jumps. Land soft, knees out, hold 2 s.",{x:2,r:30}),
          I("Skater bounds & stick",30,"Bound sideways, land on one leg, hold 2 s. About 8.",{x:2,r:30}),
          I("Broad jump & stick",60,"5 max jumps. Reset between each.",{r:20}),
          I("Single-leg hop & stick",30,"Forward and sideways, 3 each. Hold 3 s.",{L:true})
        ]},
        strength:{title:"Legs", items:[
          I("Split squat",40,"Rear foot on a bench when it gets easy.",{L:true,x:2,r:20}),
          I("Single-leg RDL",30,"Hinge at the hips, reach down, back flat.",{L:true,r:20}),
          I("Single-leg calf raise",30,"Full range, slow down.",{L:true}),
          I("Stretch",80,STRETCH_CUE)
        ]},
        skill:{title:"Finish Through Contact", ch:"mikan60", items:[
          I("Mikan + reverse Mikan",120,"Both hands, both sides of the rim."),
          I("Euro step layups",120,"Big step one way, long step the other, finish high."),
          I("Power finishes",120,"Two-foot gather, chin the ball, finish through contact."),
          I("Weak-hand layups",120,"Weak hand only, both sides."),
          I("Get ready",60,"Stand under the rim with your ball.",{t:"rest"}),
          I("CHALLENGE · Mikan Minute",60,"Makes in 60 s. Alternate hands.",{t:"challenge", ch:"mikan60"})
        ]}
      },
      wed:{
        athletic:{title:"Defense Footwork", items:[
          I("Defensive stance hold",30,"Feet wide, hips down, back flat, hands active.",{x:2,r:15}),
          I("Lane slides",25,"Lane width (4.9 m). Touch the line each side.",{x:3,r:20}),
          I("Zig-zag + drop step",30,"Slide on a diagonal, drop step, slide back.",{x:2,r:25}),
          I("Closeout, slide, recover",20,"Close out, slide 2 steps, sprint back to help.",{x:3,r:15}),
          I("Arrow slides",40,"Slide the way the arrow points. Stay low.",{t:"arrows", dirs:["left","right"]})
        ]},
        strength:{title:"Core & Balance", items:[
          I("Side plank",30,"Straight line, hips high.",{L:true,x:2,r:20}),
          I("Bird dog",40,"Slow and long. Don't rotate.",{r:20}),
          I("Hollow hold",30,"Low back pressed down, arms by ears.",{x:2,r:15}),
          I("Eyes-closed balance",30,"One leg, eyes closed. Stay tall.",{L:true}),
          I("Stretch",50,STRETCH_CUE)
        ]},
        skill:{title:"Shoot Tired + Free Throws", ch:"ft20", items:[
          I("Pass-fake pull-up",120,"Pass fake, one dribble, pull up from 4 m."),
          I("Rebound & outlet",120,"Toss off the backboard, grab it high, chin it, pivot, outlet."),
          I("Sprint-back jumpers",120,"Sprint to half court and back, catch and shoot."),
          I("Free-throw routine",60,"Same routine every time."),
          I("CHALLENGE · Free Throw 20",180,"Shoot 20. Count your makes.",{t:"challenge", ch:"ft20"})
        ]}
      },
      thu:{
        athletic:{title:"Speed & First Step", items:[
          I("Wall drive switches",20,"Lean into a wall, drive a knee up, switch fast.",{x:2,r:20}),
          I("Falling starts",30,"Lean until you almost fall, sprint 10 m. 2 per set.",{x:2,r:30}),
          I("Arrow sprints",60,"Sprint 5 m the way the arrow points, back to the middle.",{t:"arrows", dirs:["left","right","up"]}),
          I("Crossover-step start",30,"Turn your hips, cross over, sprint 10 m. Both sides.",{x:2,r:30}),
          I("Build-up runs",20,"Build up for 10 m, full speed for the last 10 m.",{x:2,r:30})
        ]},
        strength:{title:"Pull + Push + Legs", items:[
          I("Table rows",40,"Under a sturdy table or low bar. Pull your chest up.",{x:2,r:20}),
          I("Feet-up push-ups",40,"Feet on a step. Body straight.",{x:2,r:20}),
          I("Reverse lunges",40,"Alternate legs. Stay tall.",{r:20}),
          I("Plank reach-outs",30,"Reach one arm forward without moving your hips.",{r:15}),
          I("Stretch",75,STRETCH_CUE)
        ]},
        skill:{title:"Spot-Up Tour", ch:"spot25", items:[
          I("5-spot catch & shoot",150,"Corners, wings, top. Mid-range, game speed."),
          I("5-spot threes",150,"Only while your form holds. Otherwise step inside the line."),
          I("Shot fake, side-step",120,"Shot fake, one side-step, shoot."),
          I("CHALLENGE · 5-Spot 25",180,"5 shots from each of 5 spots. Makes out of 25.",{t:"challenge", ch:"spot25"})
        ]}
      },
      fri:{
        athletic:{title:"Jump + Test Day", test:true, items:[
          I("Pogo hops",15,"Stiff ankles, fast off the floor.",{x:2,r:15}),
          I("Countermovement jump & stick",30,"5 max jumps. Freeze every landing.",{x:2,r:30}),
          I("TEST · Broad jump",90,"3 tries. Measure line to back heel. Remember your best.",{test:"broad"}),
          I("TEST · Slide test",30,"Lane width. Count line touches in 30 s.",{test:"slides", r:60}),
          I("TEST · Plank hold",120,"Hold as long as you can. Note your time.",{test:"plank"})
        ]},
        strength:{title:"Recover", items:[
          I("Wall sit",45,"Thighs level with the floor.",{r:15}),
          I("Single-leg glute bridge",30,"Hips level, squeeze at the top.",{L:true,r:15}),
          I("Mountain climbers",30,"Fast knees, hips low.",{x:2,r:20}),
          I("Stretch & breathe",185,STRETCH_CUE)
        ]},
        skill:{title:"Game Day", ch:"btp11", items:[
          I("Warm-up shots",120,"Close shots, both hands."),
          I("Layups, both hands",120,"Game speed, both sides."),
          I("Spot-ups",120,"Your best spots, game speed."),
          I("CHALLENGE · Beat the Pro",240,"Make = 1 for you. Miss = 2 for the Pro. First to 11.",{t:"challenge", ch:"btp11"})
        ]}
      }
    }
  }
};

export const WEEKDAYS = ["mon","tue","wed","thu","fri"];
export const DAY_LONG = {mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"};
export const DAY_SHORT = {mon:"Mon",tue:"Tue",wed:"Wed",thu:"Thu",fri:"Fri"};
export const BADGES = [
  {n:5, label:"First week"},{n:10, label:"Two weeks"},{n:20, label:"Four weeks"},
  {n:30, label:"30-day handles"},{n:50, label:"Fifty"},{n:75, label:"Seventy-five"},{n:100, label:"Hundred club"}
];

