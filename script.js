//MVCish (i don't know if this is even legal)
var view = {
    width: 350,
    height: 350,
    scaleY: d3.scaleLinear().domain([350, 0]).range([0, 350]),
    reverseScaleY: d3.scaleLinear().domain([0, 350]).range([350, 0]),
    init() {
        //Create svg element to hold graph
        this.svg = d3.select(".linear-graph")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        //Create rectangle
        this.rect = this.svg.append("rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "#ffffff");

        //Attach listener
    },
    setOnClick(onClickListener) {
        const scaleY = this.scaleY;
        this.rect.on("click", function handleClick(event) {
            const coords = d3.pointer(event)
            const newCoords = [coords[0], scaleY(coords[1])];
            onClickListener(newCoords);
        });
    },
    appendPointToCanvas(point) {
        //Flip y scale, 
        const x = point[0];
        const y = this.reverseScaleY(point[1]);

        //Append point
        this.svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", "10px")
            .style("fill", "#E63946");
    },
    appendPointToList(point) {
        
    }

}

var controller = {
    init() {
        view.init();
        view.setOnClick(function onViewClicked(mousePos) {
            view.appendPointToCanvas(mousePos);
        });
    }
}

var model = {

}

//Run
controller.init();