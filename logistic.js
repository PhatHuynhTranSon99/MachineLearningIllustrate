//MVCish again (I still dont know if this is legal)
var logisticView = {
    width: 350,
    height: 350,
    scaleY: d3.scaleLinear().domain([350, 0]).range([0, 1]),
    scaleX: d3.scaleLinear().domain([0, 350]).range([0, 1]),
    reverseScaleY: d3.scaleLinear().domain([0, 1]).range([350, 0]),
    reverseScaleX: d3.scaleLinear().domain([0, 1]).range([0, 350]),
    init() {
        //Create svg element to hold graph
        this.svg = d3.select(".logistic-graph")
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
    setOnGreenButtonClick(listener) {
        document.querySelector(".green-class")
            .addEventListener("click", () => listener());
    },
    setOnRedButtonClick(listener) {
        document.querySelector(".red-class")
            .addEventListener("click", () => listener());
    },
    setOnResetButtonClick(listener) {
        document.querySelector(".logistic-button")
            .addEventListener("click", () => listener());
    },
    setGreenActive() {
        this.setInactive();
        document.querySelector(".green-class")  
            .style.outline = "3px solid #e9c46a";
        document.querySelector(".green-class")
            .style.outlineOffset = "2px";
    },
    setRedActive() {
        this.setInactive();
        document.querySelector(".red-class")  
            .style.outline = "3px solid #e9c46a";
        document.querySelector(".red-class")
            .style.outlineOffset = "2px";
    },
    setInactive() {
        //Reset green button
        document.querySelector(".green-class")  
            .style.outline = "none";
        document.querySelector(".green-class")
            .style.outlineOffset = "none";

        //Reset red button
        document.querySelector(".red-class")  
            .style.outline = "none";
        document.querySelector(".red-class")
            .style.outlineOffset = "none";
    },
    appendPointToCanvas(point, isGreen=true) {
        //Flip y scale, 
        const x = this.reverseScaleX(point[0]);
        const y = this.reverseScaleY(point[1]);

        //Append point
        const button = this.svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", "10px");

        //Check button
        if (isGreen) {
            button.style("fill", "#2A9D8F");
        } else {
            button.style("fill", "#E63946");
        }
    },
    //Render line
    renderLine(b0, b1, b2) {
        //Find point
        let firstPoint = [0, this.calculateX2(0, b0, b1, b2)];
        let secondPoint = [1, this.calculateX2(1, b0, b1, b2)];

        //Convert points
        let convertedFirstPoint = [this.reverseScaleX(firstPoint[0]), this.reverseScaleY(firstPoint[1])];
        let convertedSecondPoint = [this.reverseScaleX(secondPoint[0]), this.reverseScaleY(secondPoint[1])];

        //Render line
        this.modifyLine(
            convertedFirstPoint[0], convertedFirstPoint[1],
            convertedSecondPoint[0], convertedSecondPoint[1]
        );
    },
    modifyLine(x1, y1, x2, y2) {
        this.svg.selectAll("line")
            .transition()
            .duration(50)
            .style("stroke", "black")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
    },
    calculateX2(x1, b0, b1, b2) {
        return (-b0 - b1 * x1) / b2;
    },
    displayEquation(b0, b1, b2) {
        //TODO
        document.querySelector(".logistic-equation")
            .textContent = `${b0.toFixed(2)} + ${b1.toFixed(2)}*x1 + ${b2.toFixed(2)}*x2 = 0`;
    },
    displayLoss(loss) {
        document.querySelector(".logistic-loss")
            .textContent = `${(loss * 100).toFixed(2)} * 10e^-2`;
    },
    hideInitialLine() {
        this.svg.selectAll("line").remove();
    },
    removeAllPoints() {
        this.svg.selectAll("circle").remove();
    },
    reset() {
        this.removeAllPoints();
        this.hideInitialLine();
        this.svg.append("line")
            .style("stroke", "black")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 350)
            .attr("y2", 350);
    }
};

var logisticModel = {
    b0: 0,
    b1: 0,
    b2: 0,
    data: [],
    converged: false,
    //Method to add data
    addData(datum) {
        this.data.push(datum);
    },
    //Method to perform prediction
    predict(x1, x2) {
        const sum = this.b0 + x1 * this.b1 + x2 * this.b2;
        const exp = Math.exp(sum);
        return 1 / (1 + exp);
    },
    //Method to calculate the loss
    loss() {
        let currentLoss = 0;

        //Accumulate loss
        for (let i = 0; i != this.data.length; ++i) {
            const [y, x1, x2] = this.data[i];
            const prediction = this.predict(x1, x2);
            currentLoss += y * Math.log(prediction) + (1 - y) * Math.log(1 - prediction);
        }

        return currentLoss;
    },
    //Method to fit data
    fit(fitHandler, step=0.2) {
        if (this.data.length == 0) {
            this.converged = true;
            return;
        }
        //Calculate the gradient w.r.t b0, b1, b2
        let dB0 = 0;
        let dB1 = 0;
        let dB2 = 0;
        
        //Accumulate gradient
        for (let i = 0; i != this.data.length; ++i) {
            const [y, x1, x2] = this.data[i];
            let prediction = this.predict(x1, x2);

            dB0 += (y - prediction) * 1
            dB1 += (y - prediction) * x1;
            dB2 += (y - prediction) * x2;
        }

        //Get new parameters
        const newB0 = this.b0 - step * dB0;
        const newB1 = this.b1 - step * dB1;
        const newB2 = this.b2 - step * dB2;

        //Check if converged
        if (Math.abs(this.b0 - newB0) < 0.01 &&
            Math.abs(this.b1 - newB1) < 0.01 &&
            Math.abs(this.b2 - newB2) < 0.01) {
            this.converged = true;
        }
        
        //Update
        this.b0 = newB0;
        this.b1 = newB1;
        this.b2 = newB2;

        //Call handler
        fitHandler(this.loss(), this.b0, this.b1, this.b2);
    },
    //Method to check convergence
    hasConverged() {
        return this.converged;
    },
    //Reset methods
    reset() {
        this.converged = false;
        this.b0 = 0;
        this.b1 = 0;
        this.b2 = 0;
        this.data = [];
    },
    resetConverge() {
        this.converged = false;
    },
};

var logisticController = {
    view: logisticView,
    model: logisticModel,
    isGreen: true,
    timeOutId: null,
    init() {
        this.view.init();
        this.view.setOnClick((coords) => this.onPointChosen(coords));
        this.view.setGreenActive();
        this.view.setOnGreenButtonClick(() => this.onGreenChosen());
        this.view.setOnRedButtonClick(() => this.onRedChosen());
        this.view.setOnResetButtonClick(() => this.reset());
    },
    onPointChosen(coords) {
        this.view.appendPointToCanvas(coords, this.isGreen);
        this.model.addData([this.isGreen ? 0 : 1, ...coords]);
        this.model.resetConverge();
        //Clear previous interval
        if (this.timeOutId) clearInterval(this.timeOutId);
        this.train();
    },
    onGreenChosen() {
        this.isGreen = true;
        this.view.setGreenActive();
    },
    onRedChosen() {
        this.isGreen = false;
        this.view.setRedActive();
    },
    onParameter(loss, b0, b1, b2) {
        //Render line
        this.view.renderLine(b0, b1, b2);
        //Render equation
        this.view.displayEquation(b0, b1, b2);
        //Render loss
        this.view.displayLoss(loss);
    },
    train() {
        this.timeOutId = setInterval(() => this.fitModel(), 5);
    },
    fitModel() {
        console.log("run");
        this.model.fit((loss, b0, b1, b2) => this.onParameter(loss, b0, b1, b2));
        if (this.model.hasConverged()) clearInterval(this.timeOutId);
    },
    reset() {
        if (this.timeOutId) clearInterval(this.timeOutId);
        this.model.reset();
        this.view.reset();
    }
}

logisticController.init();

