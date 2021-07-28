//View
var pcaView = {
    width: 350,
    height: 350,
    scaleY: d3.scaleLinear().domain([350, 0]).range([-1, 1]),
    scaleX: d3.scaleLinear().domain([0, 350]).range([-1, 1]),
    reverseScaleY: d3.scaleLinear().domain([-1, 1]).range([350, 0]),
    reverseScaleX: d3.scaleLinear().domain([-1, 1]).range([0, 350]),
    init() {
        //Create svg element to hold graph
        this.svg = d3.select(".pca-graph")
            .append("svg")
            .style("transform", "translateY(2px)")
            .attr("width", this.width)
            .attr("height", this.height);

        //Create rectangle
        this.rect = this.svg.append("rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "#ffffff");
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
    setOnFindButtonClick(listener) {
        document.querySelector(".pca-find-button")
            .addEventListener("click", () => listener());
    },
    setOnResetButtonClick(listener) {
        document.querySelector(".pca-reset-button")
            .addEventListener("click", () => listener());
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
    renderComponent(data, component, value) {
        //Calculate first point
        const firstPoint = this.getCentroid(data);
        const secondPoint = [firstPoint[0] + component[0] * value / 2, firstPoint[1] + component[1] * value / 2];

        console.log(firstPoint);

        //Calculate the coords in the plane
        const convertedFirstPoint = [this.reverseScaleX(firstPoint[0]), this.reverseScaleY(firstPoint[1])];
        const convertedSecondPoint = [this.reverseScaleX(secondPoint[0]), this.reverseScaleY(secondPoint[1])];

        //Draw 
        this.drawLine(convertedFirstPoint[0], convertedFirstPoint[1], convertedSecondPoint[0], convertedSecondPoint[1]);
    },
    getCentroid(data) {
        console.log(data);
        const xCentroid = data.reduce((current, newItem) => current + newItem[0], 0);
        const yCentroid = data.reduce((current, newItem) => current + newItem[1], 0);
        return [xCentroid / data.length, yCentroid / data.length];
    },
    drawLine(x1, y1, x2, y2) {
        this.svg.append("line")
            .attr("class", "linear")
            .style("stroke", "black")
            .style("stroke-width", "5px")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
    },
    renderComponents(data, vectors, values) {
        for (let i = 0; i != vectors.length; ++i) {
            this.renderComponent(data, vectors[i], values[i]);
        }
    },
    reset() {
        this.clearLines();
        this.clearPoints();
    },
    clearPoints() {
        this.svg.selectAll("circle").remove();
    },
    clearLines() {
        this.svg.selectAll("line.linear").remove();
    }
};

//Model
var pcaModel = {
    data: [],
    eigenvectors: [],
    eigenvalues: [],
    addData(datum) {
        this.data.push(datum);
    },
    findPCA() {
        //Find X^TX
        const x = math.matrix(this.data);
        const xTransposed = math.transpose(x);
        const result = math.multiply(xTransposed, x);

        //Find its eigenvectors and eigenvalues
        const eigs = math.eigs(result);
        const eigenvectors = eigs.vectors; // [col1, col2] columns as eigenvectors
        const eigenvalues = eigs.values; //Eigenvalues in array

        //Cache and return
        this.eigenvectors = this.processEigenvectors(eigenvectors);
        this.eigenvalues = this.processEigenvalues(eigenvalues);

        return this.eigenvectors;
    },
    processEigenvectors(vectors) {
        //Get vectors as column vectors
        const firstVector = math.column(vectors, 0)._data;
        const secondVector = math.column(vectors, 1)._data;

        //Flatten
        return [this.flatten(firstVector), this.flatten(secondVector)];
    },
    flatten(vector) {
        return vector.map(item => {
            if (Array.isArray(item)) return item[0];
            return item;
        });
    },
    processEigenvalues(values) {
        return values._data;
    },
    reset() {
        this.pca = [];
        this.data = [];
    },
    getEigenvectors() {
        return this.eigenvectors;
    },
    getEigenvalues() {
        return this.eigenvalues;
    },
    getData() {
        return this.data;
    }
};

//Controller
var pcaController = {
    view: pcaView,
    model: pcaModel,
    init() {
        this.view.init();
        this.view.setOnClick((coords) => this.onPointChosen(coords));
        this.view.setOnFindButtonClick(() => this.onFind());
        this.view.setOnResetButtonClick(() => this.onReset());
    },
    onPointChosen(coords) {
        this.view.appendPointToCanvas(coords);
        this.model.addData(coords);
    },
    onReset() {
        this.model.reset();
        this.view.reset();
    },
    onFind() {
        this.model.findPCA();
        this.view.renderComponents(
            this.model.getData(),
            this.model.getEigenvectors(), 
            this.model.getEigenvalues()
        );
    }
};

//Init controller
pcaController.init();