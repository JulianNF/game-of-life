import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


// We'll need a helper function later on to help us make copies of deep arrays. We'll write it up here so that anyone reviewing the code isn't caught off-guard by the sudden use of the function later on:
function arrayClone(arr) {
    return JSON.parse(JSON.stringify(arr));
}



// We'll write a React component that we'll use for rendering each of the cells in our grid, which we'll call boxes:
class Box extends React.Component {
    // As we create our individual boxes, we want to make sure that when they're clicked, they trigger our selectBox function (located in the Main component, but passed as a property here via the Grid component, to whom it was first passed as a property when Grid was called by the Main component)

    // According to the rules of React, there's no way to pass anything to this.props if it's within the render method (otherwise we get the following warning: "Cannot update during an existing state transition (such as within 'render'). Render methods should be a pure function of props and state.")
    // For this reason, we'll write out a "local version" of the selectBox function, which will actually simply call our selectBox function, to which we have access to via props:
        // Note the importance of using fat-arrow functions to define our functions within React components, otherwise "this" will not be correctly bound.
    selectBox = () => {
        this.props.selectBox(this.props.row, this.props.col)
    };

    render() {
        // Remember: class is a reserved name in JavaScript, so in JSX we use "className" instead of class when we're referring to the class of an HTML element.
        return (
            <div
                className = {this.props.boxClass}
                id = {this.props.boxId}
                onClick = {this.selectBox}
            >
            </div>
        );
    };
};


class Grid extends React.Component {
    render() {
        // We'll define the width of our grid by multiplying the number of columns by the width (in pixels, defined in CSS) of each box in our grid:
        const width = this.props.cols * 15;

        // We'll define an array variable to which we'll be adding the rendered result of the Box component for each box in our grid:
        let rowsArr = [];

        // We'll use nested FOR loops to work our way through each of the boxes in our grid (ie: for each column within each row):
        for (let i = 0; i < this.props.rows; i++) {
            for (let j = 0; j < this.props.cols; j++) {
                // For each box, we'll create a boxID, which we'll pass to our Box component so that it can render boxes with unique ID attributes: 
                let boxId = i + "_" + j;

                // We'll also use a ternary operator to determine which classes our current box should have. Remember that each entry into our gridFull array is a boolean (TRUE or FALSE). If the current box is true, then the "on" class should be assigned to the box, otherwise, the "off" class should be assigned. The "box" class will always be included as we need that to correctly style the boxes (i.e. there are CSS rules for class "box"). 
                let boxClass = this.props.gridFull[i][j] ? "box on" : "box off";

                // For each Box in our grid, we'll push a Box-component-rendered element to our rowsArr:
                    // Note that each child in a list should have a unique "key" property, which is why we pass the boxId as a property named "key" to our Box component, even though it appears that we never use it in our Box component.
                rowsArr.push(
                    <Box
                        boxClass = {boxClass}
                        boxId = {boxId}
                        key = {boxId}
                        row = {i}
                        col = {j}
                        selectBox={this.props.selectBox}
                    />
                );
            };
        };

        // We'll return our big array of boxes (rowsArr). Between setting the width style property inline here, and the CSS rules we have for each box (including display: inline-block), the entries in our rowsArr will naturally "break" onto the next row of the grid as they populate it:
        return (
            <div className="grid" style={{ width: width }}>
                {rowsArr}
            </div>
        );
    };
};


// Let's create a component that will render our buttons toolbar:
class Buttons extends React.Component {
    // We'll create a function that will handle click events for our grid size selection buttons. This function will take the content of the button (eg: 20x10, 50x30, 70x50) and pass it to the gridSize function (located in our Main component, but made accessible in the Buttons component by passing it to the Buttons component as a property):
    handleSelection = (event) => {
        this.props.gridSize(event.target.textContent)
    };

    render() {
        return (
            <div className="center">
                <div className="button-toolbar">
                    <button onClick={this.props.playButton}>Play</button>
                    <button onClick={this.props.pauseButton}>Pause</button>
                    <button onClick={this.props.clear}>Clear</button>
                    <button onClick={this.props.slow}>Slow</button>
                    <button onClick={this.props.fast}>Fast</button>
                    <button onClick={this.props.seed}>Seed</button>
                    
                    { /* Rather than use Bootstrap to make a basic dropdown menu, I've used basic HTML/CSS because it really isn't necessary to use an entire library to do dropdown menus. Note that I've also ommitted to use Beau's eventKey attribute and Case statement (in Main's gridSize function) to handle changes in the number of columns and rows for the grid: */ }
                    <div className="dropdown">
                        <button className="dropbtn">Grid Size</button>
                        <div className="dropdown-content">
                            <button onClick={this.handleSelection}>20x10</button>
                            <button onClick={this.handleSelection}>50x30</button>
                            <button onClick={this.handleSelection}>70x50</button>
                        </div>
                    </div>

                </div>
            </div>
        );
    };
};



class Main extends React.Component {
    constructor() {
        super();
        // We define some variables outside of the state because we will use these when initializing/generating the state variables
        this.speed = 100;
        this.rows = 30;
        this.cols = 50;

        // We'll also define the state, with generations set to zero, and with gridFull (ie: the nested array representing the full grid) with all of the boxes set to false to start with:
        this.state = {
            generation: 0,
            gridFull: Array(this.rows).fill().map(() => Array(this.cols).fill(false))
        };
    };


    // We'll write a function to handle when the user clicks on a box in the grid. The desired behaviour is for the box to toggle to the opposite state:
    selectBox = (row, col) => {
        // We'll use our deep-copy helper function to clone gridFull (in order to avoid mutations, which are undesirable, especially when it comes to state):
        let gridCopy = arrayClone(this.state.gridFull);
        // Set the value of the current box to the opposite...
        gridCopy[row][col] = !gridCopy[row][col];
        // ... and update gridFull in the state:
        this.setState({
            gridFull: gridCopy
        });
    };


    // We also need a function for populating the grid with "live" boxes:
    seed = () => {
        // We'll create a copy of the gridFull array to avoid any mutations:
        let gridCopy = arrayClone(this.state.gridFull);
        // We'll loop through all the columns in all the rows using nested FOR loops:
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // At each box, let's make it a 25% chance of it being set to true (ie: "alive") at seed:
                if (Math.floor(Math.random() * 4) === 1) {
                    gridCopy[i][j] = true;
                };
            };
        };
        // And then we'll update gridFull in the state:
        this.setState({
            gridFull: gridCopy
        });

        // And we'll make sure that the game is playing:
        this.playButton();
    };


    // A function for the desired behaviour when the play button is pressed:
    playButton = () => {
        // We'll clear any ongoing setInterval (for this to work, the setInterval() needs to have a name)
        clearInterval(this.intervalId);
        // ... and we'll start up a new setInterval, giving it a name so that it can be stopped later on, telling it what to do at the end of each interval (ie: this.play), and telling it to run every "this.speed" milliseconds:
        this.intervalId = setInterval(this.play, this.speed);
    };


    // When the pause button is clicked, we want to stop the setInterval:
    pauseButton = () => {
        clearInterval(this.intervalId);
    };


    // When the slow button is clicked, we want to update the speed variable and trigger the playButton function so that the play resumes:
    slow = () => {
        this.speed = 1000;
        this.playButton();
    };


    // When the fast button is clicked, we want to update the speed variable and trigger the playButton function so that the play resumes:
    fast = () => {
        this.speed = 100;
        this.playButton();
    };


    // When the clear button is clicked, we want all of the boxes in the grid to be reset to false within our state's gridFull array.
    clear = () => {
        // It would be a good idea to refactor this as we also use this line of code in our state definition:
        let grid = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        // We'll update our state and also make sure to set generations back to zero:
        this.setState({
            gridFull: grid,
            generation: 0
        });
    };


    // When the gridsize buttons are clicked, we want to update the size of our grid. Rather than use the bootstrap-based method that Beau suggests for making the dropdown, I chose to write the dropdown with basic CSS and HTML. In order to update the size of the grid, all we need to do is to take the first 2 characters of the incoming string (for the rows) or the last 2 characters of the incoming string (for the columns), and make sure to convert these from string to integers:
    gridSize = (rowXcol) => {
        this.rows = parseInt(rowXcol.slice(0, 2));
        this.cols = parseInt(rowXcol.slice(3, 5));
        // When we update the grid size, we'll also clear/reset the grid:
        this.pauseButton();
        this.clear();
        
    };


    // When the play button is clicked, we want the Game of Life logic to run its course.
    play = () => {
        // Rather than call "this.state.gridFull", we'll save the state as a short-named variable, which will make our code below tidier and less confusing:
        let g = this.state.gridFull;
        // We'll need to create an updated grid, for which we'll need a cloned copy of the state's gridFull array. Later on, we'll update the state with this array:
        let g2 = arrayClone(this.state.gridFull);

        // It's time to put in the logic for determining if a cell should be "alive" or "dead", according to the rules for Conway's Game of Life (https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life):
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // We'll use a variable to keep track of how many "alive" (ie: true) neighbours the current box has around it:
                let count = 0;
                // Each box could potentially have up to 8 neighboring boxes. Let's check each of these:

                // check box above:
                if (i > 0) if (g[i - 1][j]) count++;
                // check box above-left:
                if (i > 0 && j > 0) if (g[i - 1][j - 1]) count++;
                // check box above-right:
                if (i > 0 && j < this.cols - 1) if (g[i - 1][j + 1]) count++;
                // check box to the right:
                if (j < this.cols - 1) if (g[i][j + 1]) count++;
                // check box to the left:
                if (j > 0) if (g[i][j - 1]) count++;
                // check box below:
                if (i < this.rows - 1) if (g[i + 1][j]) count++;
                // check box below-left:
                if (i < this.rows - 1 && j > 0) if (g[i + 1][j - 1]) count++;
                // check box below-right:
                if (i < this.rows - 1 && j < this.cols - 1) if (g[i + 1][j + 1]) count++;

                // Now that we know how many boxes are "alive" around the current box, let's update the current box's status as needed:

                // If the box is "alive" but the area is "underpopulated" or "overpopulated" according to the rules, then "kill" the box:
                if (g[i][j] && (count < 2 || count > 3)) g2[i][j] = false;
                // If the cell is "dead", but population conditions are good according to the rules, give "life" to the cell:
                if (!g[i][j] && count === 3) g2[i][j] = true;
            };
        };

        // Once we've worked through all the boxes, we can update the state's gridFull array, and update the generations counter as well:
        this.setState({
            gridFull: g2,
            generation: this.state.generation + 1
        });
    };


    // When this component mounts (component life cycle), we want the following to happen:
    componentDidMount() {
        this.seed();
        this.playButton();
    };


    // With all of our functions ready, let's call the render method for our Main component:
    render() {
        return (
            <div>
                <h1>The Game of Life</h1>
                {/* We'll render our Buttons component, passing it the following properties:  */}
                <Buttons
                    playButton = {this.playButton}
                    pauseButton = {this.pauseButton}
                    slow = {this.slow}
                    fast = {this.fast}
                    clear = {this.clear}
                    seed = {this.seed}
                    gridSize = {this.gridSize}
                />
                {/* And below the Buttons' rendering, we'll render our Grid component, passing it the following properties:  */}
                <Grid
                    gridFull = {this.state.gridFull}
                    rows = {this.rows}
                    cols = {this.cols}
                    selectBox = {this.selectBox}
                />
                <h2>Generations: {this.state.generation}</h2>
            </div>
        );
    };
};


// Finally, we'll render to the (React)DOM:
ReactDOM.render(
    <Main />,
    document.getElementById('root')
);