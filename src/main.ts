import "./style.css";
import { interval, fromEvent, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";




function main() {
  /**
   * Inside this function you will use the classes and functions from rx.js
   * to add visuals to the svg element in pong.html, animate them, and make them interactive.
   *
   * Study and complete the tasks in observable examples first to get ideas.
   *
   * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
   *
   * You will be marked on your functional programming style
   * as well as the functionality that you implement.
   *
   * Document your code!
   */

  /**
   * This is the view for your game to add and update your game elements.
   */
  const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;

  // get the svg canvas element

  const CONSTANTS = {
    BACKGROUND_HEIGHT: 600,
    BACKGROUND_WIDTH: 600,
    BACKGROUND_UPPER_BOUND: 40,
    GAME_TICK_DURATION: 100,
    ROWS_HEIGHT: 40, //Height of every rows of the background
    FROG_HEIGHT: 40, //heigh of background 600 / 15 rows
    FROG_WIDTH: 40,//width of background 600 / 15 col
    FROG_START_X: 40 * 7, //FROG WIDTH * 7
    FROG_START_Y: 600 - 40, //canvas height  - FROG_LENGTH
    CAR_HEIGHT: 40,
    CAR_WIDTH: 40,
    CAR_SEPERTATION_WIDTH: 120,
    FONT_SIZE: 50,
    RIVER_HEIGHT: 240,
    RIVER_WIDTH: 600,
    RIVER_X: 0,  //x position of river
    RIVER_Y: 2 * 40,//y position of river
    PLANK_WIDTH: 40,
    PLANK_HEIGHT: 40,
    PLANK_SEPERTATION_WIDTH: 100,
    PLANK_ROW: 8,
    DISTINCTAREA_HEIGHT: 40,
    DISTINCTAREA_WIDTH: 2 * 40,
    DISTINCTAREA_X: 0,
    DISTINCTAREA_Y: 2 * 40,
    DISTINCTAREA_SPERATION: 2 * 40,
    SCORE: 10, //basic score gained when reach distinct area 
    WIDTH_UNIT: 40,
    HEIGHT_UNIT: 40,
    TIME_DURATION: 60,
    RIVER_COLOR: "#6290C8",
    CAR_COLOR_1: "#c7ae3c",
    CAR_COLOR_2: "#3c4cc7",
    CAR_COLOR_3: "#95ABB1",
    CAR_COLOR_4: "#D6D6D8",
    CAR_COLOR_5: "#D5B94F",
    FILLED_COLOR: "#F96900",
    PLANK_COLOR: "#563232",
    TURTLE_COLOR: "#F03A47",
    TURTLE_DIVE_COLOR: "#183059",
    TURTLE_WIDTH: 40,
    TURTLE_HEIGHT: 40,
    TURTLE_SEPERTATION_WIDTH: 80,
    TURTLE_ROW: 7,
    TURTLE_DIVE_INTERVAL: 6


  } as const;
  //declaring the type
  type State = Readonly<{
    frog: Frog,
    carsArray: Readonly<Object[][]>,      //use nested array to represent different cars in different rows
    river: River,
    scoreAreasArray: Readonly<ScoreArea[]>, //array to store the attributes of different distinct area
    planksArray: Readonly<Object[][]>,  //use nested array to represent different planks in different rows
    turtlesArray: Readonly<Turtle[]>
    userScore: number,
    timer: number,
    previousScore: number,

  }>

  type Frog = Readonly<{
    id: string,
    x: number, //starting x position
    y: number, //starting y position
    width: number,
    height: number
  }>

  type Object = Readonly<{
    id: string,
    row: number,
    x: number,
    y: number,
    width: number,
    height: number,
    speed: number,
    colour: string
  }>
  type Turtle = Readonly<{
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    speed: number,
    colour: string,
    diveIntoWater: boolean,
    colorAfterDive: string,
    colorBeforeDive: string
  }>


  type River = Readonly<{
    id: string,
    x: number,
    y: number,
    height: number,
    width: number
  }>
  type ScoreArea = Readonly<{
    id: string,
    x: number,
    y: number,
    height: number,
    width: number,
    colour: string,
    available: boolean, //to represent is the area filled or not filled

  }>

  //Initial State of the game, one of the important feacture to make this game pure
  const initialState: State = {
    //initializing the attributes of the frog
    frog: {
      id: "FROG",
      x: CONSTANTS.FROG_START_X,
      y: CONSTANTS.FROG_START_Y,
      width: CONSTANTS.FROG_WIDTH,
      height: CONSTANTS.FROG_HEIGHT
    },
    //initializing the attributes of the cars by creating 5 cars with different width colour and speed
    carsArray: [createCars(1, 2, CONSTANTS.CAR_WIDTH, CONSTANTS.CAR_HEIGHT, CONSTANTS.CAR_SEPERTATION_WIDTH, 8, CONSTANTS.CAR_COLOR_1, []),
    createCars(2, 2, 2 * CONSTANTS.CAR_WIDTH, CONSTANTS.CAR_HEIGHT, CONSTANTS.CAR_SEPERTATION_WIDTH, -8, CONSTANTS.CAR_COLOR_2, []),
    createCars(3, 1, CONSTANTS.CAR_WIDTH, CONSTANTS.CAR_HEIGHT, CONSTANTS.CAR_SEPERTATION_WIDTH, 12, CONSTANTS.CAR_COLOR_3, []),
    createCars(4, 3, CONSTANTS.CAR_WIDTH, CONSTANTS.CAR_HEIGHT, CONSTANTS.CAR_SEPERTATION_WIDTH, -3, CONSTANTS.CAR_COLOR_4, []),
    createCars(5, 2, 2 * CONSTANTS.CAR_WIDTH, CONSTANTS.CAR_HEIGHT, CONSTANTS.CAR_SEPERTATION_WIDTH, 7, CONSTANTS.CAR_COLOR_5, []),
    ],
    //initializing the are of river
    river: {
      id: "RIVER",
      x: CONSTANTS.RIVER_X,
      y: CONSTANTS.RIVER_Y,
      height: CONSTANTS.RIVER_HEIGHT,
      width: CONSTANTS.BACKGROUND_WIDTH,

    },
    //initializing the distinct area
    scoreAreasArray: [
      {
        id: "SCOREAREA1",
        x: CONSTANTS.DISTINCTAREA_X + CONSTANTS.DISTINCTAREA_SPERATION,
        y: CONSTANTS.DISTINCTAREA_Y,
        height: CONSTANTS.DISTINCTAREA_HEIGHT,
        width: CONSTANTS.DISTINCTAREA_WIDTH,
        colour: CONSTANTS.RIVER_COLOR,
        available: true

      }, {
        id: "SCOREAREA2",
        x: 2 * CONSTANTS.DISTINCTAREA_SPERATION + CONSTANTS.DISTINCTAREA_WIDTH,
        y: CONSTANTS.DISTINCTAREA_Y,
        height: CONSTANTS.DISTINCTAREA_HEIGHT,
        width: CONSTANTS.DISTINCTAREA_WIDTH,
        colour: CONSTANTS.RIVER_COLOR,
        available: true,

      },
      {
        id: "SCOREAREA3",
        x: 3 * CONSTANTS.DISTINCTAREA_SPERATION + 2 * CONSTANTS.DISTINCTAREA_WIDTH,
        y: CONSTANTS.DISTINCTAREA_Y,
        height: CONSTANTS.DISTINCTAREA_HEIGHT,
        width: CONSTANTS.DISTINCTAREA_WIDTH,
        colour: CONSTANTS.RIVER_COLOR,
        available: true
      }]

    ,
    //initializing the planks by creating 5 planks for each rows
    planksArray: [createPlanks(1, 2, 3 * CONSTANTS.PLANK_WIDTH, CONSTANTS.PLANK_HEIGHT, CONSTANTS.PLANK_SEPERTATION_WIDTH, +4, []),
    createPlanks(2, 2, 4 * CONSTANTS.PLANK_WIDTH, CONSTANTS.PLANK_HEIGHT, 2 * CONSTANTS.PLANK_SEPERTATION_WIDTH, -3, []),
    createPlanks(3, 1, 5 * CONSTANTS.PLANK_WIDTH, CONSTANTS.PLANK_HEIGHT, CONSTANTS.PLANK_SEPERTATION_WIDTH, 4, []),
    createPlanks(4, 1, 4 * CONSTANTS.PLANK_WIDTH, CONSTANTS.PLANK_HEIGHT, CONSTANTS.PLANK_SEPERTATION_WIDTH, -6, []),
    ],
    turtlesArray: createTurtle(3, 3 * CONSTANTS.TURTLE_WIDTH, CONSTANTS.TURTLE_HEIGHT, CONSTANTS.TURTLE_SEPERTATION_WIDTH, 3, CONSTANTS.TURTLE_COLOR, CONSTANTS.TURTLE_DIVE_COLOR, []),
    userScore: 0,
    timer: CONSTANTS.TIME_DURATION,
    previousScore: 0,

  }

  //using recursive function to create cars and initializing them 
  function createCars(rowNum: number, carNum: number, carWidth: number, carHeight: number, seperationDistance: number, carSpeed: number, carColor: string, cars: Object[]): Object[] {
    if (carNum === -1) {
      return cars
    } else {
      const newCar: Object = {
        id: "Car-row-" + rowNum + "-" + carNum,
        row: rowNum,
        x: carNum * (carWidth + seperationDistance),
        y: CONSTANTS.BACKGROUND_HEIGHT - ((rowNum + 1) * carHeight),
        width: carWidth,
        height: carHeight,
        colour: carColor,
        speed: carSpeed
      }
      return createCars(rowNum, carNum - 1, carWidth, carHeight, seperationDistance, carSpeed, carColor, cars.concat(newCar));
    }
  }
  //using recursive function to create planks and initializing them 
  function createPlanks(rowNum: number, plankNum: number, plankWidth: number, plankHeight: number, seperationDistance: number, plankSpeed: number, planks: Object[]): Object[] {
    if (plankNum === -1) {
      return planks
    } else {
      const newPlank: Object = {
        id: "Plank-row-" + rowNum + "-" + plankNum,
        row: rowNum,
        x: plankNum * (plankWidth + seperationDistance),
        y: CONSTANTS.BACKGROUND_HEIGHT - ((rowNum + CONSTANTS.PLANK_ROW) * plankHeight),
        width: plankWidth,
        height: plankHeight,
        colour: CONSTANTS.PLANK_COLOR,
        speed: plankSpeed
      }
      return createPlanks(rowNum, plankNum - 1, plankWidth, plankHeight, seperationDistance, plankSpeed, planks.concat(newPlank));
    }
  }
  //using recursive function to create turtles and initializing them 
  function createTurtle(turtleNum: number, turtleWidth: number, turtleHeight: number, seperationDistance: number, turtleSpeed: number, turtleColor: string, diveColor: string, turtles: Turtle[]): Turtle[] {
    if (turtleNum === -1) {
      return turtles
    } else {
      const newTurtle: Turtle = {
        id: "turtle-" + turtleNum,
        x: turtleNum * (turtleWidth + seperationDistance),
        y: CONSTANTS.BACKGROUND_HEIGHT - ((1 + CONSTANTS.TURTLE_ROW) * turtleHeight),
        width: turtleWidth,
        height: turtleHeight,
        colour: turtleColor,
        speed: turtleSpeed,
        diveIntoWater: false,
        colorAfterDive: diveColor,
        colorBeforeDive: turtleColor
      }
      return createTurtle(turtleNum - 1, turtleWidth, turtleHeight, seperationDistance, turtleSpeed, turtleColor, diveColor, turtles.concat(newTurtle));
    }
  }





  //create three classes for different command so we can detect the class type in reduceState and return new state
  class Tick { constructor(public readonly elapsed: number) { } }
  class Move { constructor(public readonly xDirection: number, public readonly yDirection: number) { } }
  class Restart { constructor() { } }

  //observing 5 key input
  type key = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Space'
  const observeKey = <T>(k: key, result: () => T) =>
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(({ code }) => code === k),
        filter(({ repeat }) => !repeat),
        map(result))
  //onbserve specific key and return following classes
  const
    moveLeft$ = observeKey('ArrowLeft', () => new Move(-CONSTANTS.FROG_WIDTH / 2, 0)),
    moveRight$ = observeKey('ArrowRight', () => new Move(CONSTANTS.FROG_WIDTH / 2, 0)),
    moveUp$ = observeKey('ArrowUp', () => new Move(0, -CONSTANTS.FROG_HEIGHT)),
    moveDown$ = observeKey('ArrowDown', () => new Move(0, CONSTANTS.FROG_HEIGHT)),
    restart$ = observeKey('Space', () => new Restart()),
    tick$ = interval(CONSTANTS.GAME_TICK_DURATION).pipe(map((number) => new Tick(number)));

  //This function will make the object reappear from the opposite site if it moved outside of the background
  const outOfBound = (x: number, background_size: number): number => {
    if (x > background_size) {
      return x - background_size
    }
    else if (x < 0) {
      return x + background_size
    } else {
      return x
    }
  }
  //This function is trying to make the frog object doesn't exceed background
  const boundary = (location: number, background_size: number): number => {
    if (location >= background_size) {
      return background_size - CONSTANTS.FROG_WIDTH
    } else if (location < 0) {
      return 0
    }
    else { return location }
  }

  //Handling collision by checking is the position of frog overlapping with cars
  const handleCollisions = (state: State) => {
    //this is the condition 
    const
      bodiesCollided = (frog: Frog, car: Object) =>
        frog.x + frog.width > car.x
        && frog.x < car.x + car.width
        && frog.y + frog.height > car.y
        && frog.y < car.y + car.height,
      //check every element of the carsArray with the condition by using filter and check if the length is greater than 0,if it is greater than
      //0 it means collisions occur and it will return a list of boolean, then filter the array with  d=>d?true:false to only find true value
      //and check if the length is greater than 0, if greater than 0 ,collision occur
      frogCollided = state.carsArray.map(cars => cars.filter(car => bodiesCollided(state.frog, car)).length > 0).filter(d => d ? true : false).length > 0

    return frogCollided ? <State>{ ...initialState } : <State>{ ...state }

  }

  //Check if the frog get into the river by checking if the frog is on the river area and not on the plank or not on a turtle
  const dropIntoRiver = (state: State) => {
    //conditiom
    const
      dropped = (frog: Frog, river: River, plank: Object, area: ScoreArea) =>
        river.y < frog.y + frog.height
        && frog.y < river.y + river.height
        && frog.x >= river.x
        && frog.x + frog.width <= river.x + river.width
        && !(frog.x >= plank.x && frog.x + frog.width <= plank.x + plank.width && frog.y >= plank.y && frog.y + frog.height <= plank.y + plank.height) //check if frog is not on the plank
        && (frog.y == plank.y || frog.y == area.y)//this condition to make sure we are only looking on the plank at the same row with frog
      ,
      droppedTurtle = (frog: Frog, river: River, turtle: Turtle) =>
        river.y < frog.y + frog.height
        && frog.y < river.y + river.height
        && frog.x >= river.x
        && frog.x + frog.width <= river.x + river.width
        && !(frog.x >= turtle.x && frog.x + frog.width <= turtle.x + turtle.width && frog.y >= turtle.y && frog.y + frog.height <= turtle.y + turtle.height && turtle.diveIntoWater == false) //check if frog is not on the turtle or a diving turtle
        && (frog.y == turtle.y)
      ,

      //check every element of the planksArray with the condition by using filter and check if the length is larger than the length of each row,if it is greater than
      //planks.length it means frog is on the river area and not on a plank and it will return a list of boolean, then filter the array with  d=>d?true:false to only find true value
      //and check if the length is greater than 0, if greater than 0 ,the frog drops into the river
      drowned = state.planksArray.map(planks => planks.filter(plank => dropped(state.frog, state.river, plank, state.scoreAreasArray[0])).length >= planks.length)
        .filter(d => d ? true : false).length > 0,
      //check if the frog is on the turtle
      drownedTurtle = state.turtlesArray.filter(turtle => droppedTurtle(state.frog, state.river, turtle)).length >= state.turtlesArray.length

    return drowned || drownedTurtle ? <State>{ ...initialState } : <State>{ ...state }
  }

  //Check if all the area are filled
  const roundCompleted = (state: State) => {
    const completed = state.scoreAreasArray.filter(areas => areas.available == false).length == state.scoreAreasArray.length
    return completed
      ? <State>{ ...initialState, previousScore: state.userScore } :
      <State>{ ...state }
  }
  //player get score when the frog enter the score area
  const score = (state: State) => {
    const
      enterScoreArea = (frog: Frog, scoreArea: ScoreArea) =>
        frog.x >= scoreArea.x
        && frog.x + frog.width <= scoreArea.x + scoreArea.width
        && frog.y >= scoreArea.y
        && frog.y + frog.height <= scoreArea.y + scoreArea.height
        && scoreArea.available == true, // checking that this area has been filled, if filled and player enter this area game over

      // checking if frog enter score area
      scored = state.scoreAreasArray.filter(area => enterScoreArea(state.frog, area)).length > 0,
      //checking and return a new state if the following area is entered
      filled = state.scoreAreasArray.map(areas => enterScoreArea(state.frog, areas) ?
        {
          ...areas,
          available: false,
          c: true,
          colour: CONSTANTS.FILLED_COLOR,
        }
        : { ...areas })
    
    return <State>{
      ...state,
      frog: {
        ...state.frog,
        x: scored ? CONSTANTS.FROG_START_X : state.frog.x, //when a frog enter a score area return it back to initial location
        y: scored ? CONSTANTS.FROG_START_Y : state.frog.y
      },
      //return new score  and area state
      userScore: scored ? state.userScore + (state.timer / 10) * CONSTANTS.SCORE : state.userScore,
      scoreAreasArray: filled,
    }
  }
  //check if the time run out, if time run out game over and return to initial state
  const timer = (state: State) => {
    const
      runOutTime = (timer: number) =>
        timer <= 1
      ,
      outOfTime = runOutTime(state.timer)
    return outOfTime ? <State>{ ...initialState } : <State>{
      ...state,
      timer: state.timer - .1,
    }

  }


  // reduceState will check the class it receive and return different state
  const reduceState = (currentState: State, event: Move | Tick | Restart): State => {
    //if receive move class update frog movement 
    if (event instanceof Move) {
      // check if the frog is move into a score area 
      return score({
        ...currentState,
        frog: {
          ...currentState.frog,
          x: boundary(currentState.frog.x + event.xDirection, CONSTANTS.BACKGROUND_WIDTH),
          y: boundary(currentState.frog.y + event.yDirection, CONSTANTS.BACKGROUND_HEIGHT)
        }

      })
    } 
    //if receive tick class check that if the timer run out, collision occurs, drops into river and round completed
    else if (event instanceof Tick) {

      return roundCompleted(handleCollisions(dropIntoRiver(timer(({
        //update all other object movement (car, plank and turtle) also update does turtle dive into water
        ...currentState,
        carsArray: currentState.carsArray.map((cars: Object[]) => cars.map((car: Object) => { return { ...car, x: outOfBound(car.x + car.speed, CONSTANTS.BACKGROUND_WIDTH) }; })),
        planksArray: currentState.planksArray.map((planks: Object[]) => planks.map((plank: Object) => { return { ...plank, x: outOfBound(plank.x + plank.speed, CONSTANTS.BACKGROUND_WIDTH) }; })),
        turtlesArray: currentState.turtlesArray.map((turtle: Turtle) => {
          return {
            ...turtle, x: outOfBound(turtle.x + turtle.speed, CONSTANTS.BACKGROUND_WIDTH),
            diveIntoWater: currentState.timer % CONSTANTS.TURTLE_DIVE_INTERVAL >= CONSTANTS.TURTLE_DIVE_INTERVAL / 2,
            colour: currentState.timer % CONSTANTS.TURTLE_DIVE_INTERVAL >= CONSTANTS.TURTLE_DIVE_INTERVAL / 2 ? turtle.colorAfterDive : turtle.colorBeforeDive
          };
        })

      })))));
    } 
    //if we receive a restart class return the initial state  
    else if (event instanceof Restart) {
      return ({ ...initialState })
    }
    else {
      return ({ ...initialState })
    }

  }


  //merge all the observable and pipe then into scan with reduceState then subsribe it with updateView which will update svg based on the changes
  const subscription = merge(moveLeft$, moveRight$, moveDown$, moveUp$, tick$, restart$).pipe(scan(reduceState, initialState)).subscribe(updateView);
  
  //this is impure 
  //update svg based on the state receive
  function updateView(state: State) {
    //update the score user gets
    const scoreText = document.querySelector("#SCORE") as SVGElement & HTMLElement;
    scoreText.textContent ="SCORE:" + state.userScore.toFixed(0);
    //update the previousScore when player finished a round
    const previousScore = document.querySelector("#PREVIOUSSCORE") as SVGElement & HTMLElement;
    previousScore.textContent = "PREVIOUS SCORE: " + state.previousScore.toFixed(0)
    //keep updating the timer of the game 
    const timerText = document.querySelector("#TIMER") as SVGElement & HTMLElement;
    timerText.textContent = "TIMER:" + state.timer.toFixed(0);


    
    //update frog position
    const frog = document.getElementById("FROG")!;

    frog!.setAttribute("x", String(state.frog.x));
    frog!.setAttribute("y", String(state.frog.y));



    const backGroundLayer = document.querySelector("#backgroundLayer") as SVGElement & HTMLElement;
    //if the car objects are not yet created, create and append them into svg
    state.carsArray.forEach((carState: Object[]) => {
      carState.forEach((cars: Object) => {
        const car = document.getElementById(cars.id);

        if (car === null) {
          const newCar = document.createElementNS(backGroundLayer.namespaceURI, "rect")
          backGroundLayer.appendChild(renderObject(newCar, cars));
        }
        //if it is created update their x position 
        else {
          { car.setAttribute("x", String(cars.x)); }

        }
      })


    });

     //if the plank objects are not yet created, create and append them into svg
    state.planksArray.forEach((plankState: Object[]) => {
      plankState.forEach((planks: Object) => {
        const plank = document.getElementById(planks.id);

        if (plank === null) {
          const newPlank = document.createElementNS(backGroundLayer.namespaceURI, "rect")

          backGroundLayer.appendChild(renderObject(newPlank, planks));
        } 
        //if it is created update their x position 
        else {
          { plank.setAttribute("x", String(planks.x)); }

        }
      })
      //if the turtle objects are not yet created, create and append them into svg
      state.turtlesArray.forEach((turtles: Turtle) => {
        const turtle = document.getElementById(turtles.id);
        if (turtle === null) {
          const newTurtle = document.createElementNS(backGroundLayer.namespaceURI, "rect")
          backGroundLayer.appendChild(renderObject(newTurtle, turtles));
        } 
        //if it is created update their x position  and the color
        else {
          turtle.setAttribute("x", String(turtles.x));
          turtle.setAttribute("fill", String(turtles.colour));
        }

      })

      //if player score is larger then 0 it means frog entered scored area
      if (state.userScore > 0) {
        state.scoreAreasArray.forEach((areas: ScoreArea) => {
          //update the color of the filled score area
          const area = document.getElementById(areas.id);
          area!.setAttribute("fill", String(areas.colour));

        })
      } else {
        //else update the color of the score area back to its original color
        state.scoreAreasArray.forEach((areas: ScoreArea) => {
          const area = document.getElementById(areas.id);
          area!.setAttribute("fill", String(areas.colour));
        })

      }
    });

  }
  // a function to render the object with their attributes
  const renderObject = (element: Element, state: Object | Turtle): Element => {
    element.setAttribute("id", state.id);
    element.setAttribute("fill", state.colour);
    element.setAttribute("width", String(state.width));
    element.setAttribute("height", String(state.height));
    element.setAttribute("x", String(state.x));
    element.setAttribute("y", String(state.y));

    return element;
  }
}





// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
