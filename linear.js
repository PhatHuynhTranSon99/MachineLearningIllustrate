//MVCish (i don't know if this is even legal)
var linearView = {
    width: 350,
    height: 350,
    scaleY: d3.scaleLinear().domain([350, 0]).range([0, 1]),
    scaleX: d3.scaleLinear().domain([0, 350]).range([0, 1]),
    reverseScaleY: d3.scaleLinear().domain([0, 1]).range([350, 0]),
    reverseScaleX: d3.scaleLinear().domain([0, 1]).range([0, 350]),
    init() {
        //Create svg element to hold graph
        this.svg = d3.select(".linear-graph")
            .append("svg")
            .style("transform", "translateY(2px)")
            .attr("width", this.width)
            .attr("height", this.height);

        //Create rectangle
        this.rect = this.svg.append("rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "#ffffff");

        //Add the line
        this.svg.append("line")
            .attr("class", "linear")
            .style("stroke", "black")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 350)
            .attr("y2", 350);
    },
    setOnClick(onClickListener) {
        const scaleY = this.scaleY;
        const scaleX = this.scaleX;
        this.rect.on("click", function handleClick(event) {
            const coords = d3.pointer(event)
            const newCoords = [scaleX(coords[0]), scaleY(coords[1])];
            onClickListener(newCoords);
        });
    },
    appendPointToCanvas(point) {
        //Flip y scale, 
        const x = this.reverseScaleX(point[0]);
        const y = this.reverseScaleY(point[1]);

        //Append point
        this.svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", "10px")
            .style("fill", "#E63946");
    },
    renderLine(b0, b1) {
        //Find point
        let firstPoint = [0, b0 + b1 * 0];
        let secondPoint = [1, b0 + b1 * 1];

        //Convert points
        let convertedFirstPoint = [this.reverseScaleX(firstPoint[0]), this.reverseScaleY(firstPoint[1])];
        let convertedSecondPoint = [this.reverseScaleX(secondPoint[0]), this.reverseScaleY(secondPoint[1])];

        //Render line
        //this.removeInitialLine();
        this.modifyLine(
            convertedFirstPoint[0], convertedFirstPoint[1],
            convertedSecondPoint[0], convertedSecondPoint[1]
        );
    },
    removeInitialLine() {
        this.svg.selectAll("line.linear").remove();
    },
    removeAllPoints() {
        this.svg.selectAll("circle").remove();
    },
    modifyLine(x1, y1, x2, y2) {
        this.svg.selectAll("line")
            .transition()
            .duration(50)
            .attr("class", "linear")
            .style("stroke", "black")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
    },
    displayEquation(b0, b1) {
        //TODO
        document.querySelector(".linear-equation")
            .textContent = `y = ${b0.toFixed(2)} + ${b1.toFixed(2)}x`;
    },
    displayLoss(loss) {
        document.querySelector(".linear-loss")
            .textContent = `${(loss * 100).toFixed(2)} * 10e^-2`;
    },
    setResetButtonOnClick(onClick) {
        document.querySelector(".linear-button")
            .addEventListener("click", () => onClick());
    },
    reset() {
        //Reset line
        this.removeInitialLine();
        this.svg.append("line")
            .attr("class", "linear")
            .style("stroke", "black")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 350)
            .attr("y2", 350);

        //Remove all points
        this.removeAllPoints();
    }
}

//Linear regression model
var linearModel = {
    //Parameter to be trained
    b0: 0,
    b1: 0,
    data: [],
    converged: false,
    //Method to add data 
    addData(datum) {
        this.data.push(datum);
    },
    //Prediction for one datum
    predict(x) {
        return this.b0 + x * this.b1
    },
    //Loss function for all data
    loss() {
        let N = this.data.length;

        let sumOfSquare = 0;
        for (let i = 0; i != N; ++i) {
            let [x, y] = this.data[i];
            sumOfSquare += Math.pow(y - this.predict(x), 2);
        }

        return sumOfSquare / (2 * N);
    },
    //Method to train on data   
    fit(parameterHandler, step=0.1) {
        if (this.data.length == 0) {
            this.converged = true;
            return;
        }
        //Calculate gradient for dB0 and dB1
        let dB0 = 0;
        let dB1 = 0;
        let N = this.data.length;

        for (let i = 0; i != N; ++i) {
            let [x, y] = this.data[i];
            dB0 += (y - this.predict(x)) * (-1);
            dB1 += (y - this.predict(x)) * (-x);
        }

        //Update b1 and b0 based on the gradient
        let newB0 =  this.b0 - step * dB0;
        let newB1 = this.b1 - step * dB1;

        //Check if converged
        if (Math.abs(newB1 - this.b1) <= 0.0001 && Math.abs(newB0 - this.b0) <= 0.0001) {
            this.converged = true;
        }

        //Update
        this.b0 = newB0;
        this.b1 = newB1;

        //Call on fit
        this.onFit(parameterHandler);
    },
    //Observable
    hasConverged() {
        return this.converged;
    },
    onFit(parameterHandler) {
        parameterHandler(this.loss(), this.b0, this.b1);
    },
    //Reset
    resetConverge() {
        this.converged = false;
    },
    reset() {
        this.data = [];
        this.b0 = 0;
        this.b1 = 0;
        this.converged = false;
    }
}

var linearController = {
    view: linearView,
    model: linearModel,
    trainingAllowed: true,
    timeOutId: null,
    init() {
        this.view.init();
        this.view.setOnClick((coords) => this.onPointChosen(coords));
        this.view.setResetButtonOnClick(() => this.onResetButtonClick());
    },
    onPointChosen(coords) {
        this.view.appendPointToCanvas(coords);
        this.model.addData(coords);
        this.model.resetConverge();
        if (this.timeOutId) clearInterval(this.timeOutId);
        this.train();
    },
    onResetButtonClick() {
        if (this.timeOutId) clearInterval(this.timeOutId);
        //Reset model
        this.model.reset();
        //Clear all points
        this.view.reset();
    },
    onParameter(loss, b0, b1) {
        //Display equation and loss
        this.view.displayEquation(b0, b1);
        this.view.displayLoss(loss);
        //Render line
        this.view.renderLine(b0, b1);
    },
    train() {
        this.timeOutId = setInterval(() => {
            console.log("run");
            this.model.fit((loss, b0, b1) => this.onParameter(loss, b0, b1));
            if (this.model.hasConverged()) clearInterval(this.timeOutId);
        }, 5);
    }
}

//Run
linearController.init();