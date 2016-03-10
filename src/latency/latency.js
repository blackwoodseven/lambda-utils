function addError(txt) {
  var alert = document.createElement("div"),
      close = document.createElement("button"),
      text = document.createElement("p");

  alert.className = "alert alert-danger alert-dismissible";
  close.className = "close";
  close.dataset.dismiss="alert";
  close.innerHTML = '<span aria-hidden="true">&times;</span>';
  text.innerText = txt;
  alert.appendChild(close);
  alert.appendChild(text);
  document.getElementById("messages").appendChild(alert);
  return alert;
}

function checkVisibility() {
  if (document.getElementById("lambdas").children.length) {
    document.forms.test.style.display = "";
  } else {
    document.forms.test.style.display = "none";
  }
}

function addLambda(data) {

  var col = document.createElement("div"),
      panel = document.createElement("div"),
      heading = document.createElement("div"),
      title = document.createElement("h5"),
      close = document.createElement("button"),
      content = document.createElement("div"),
      pre = document.createElement("pre");
  col.className = "col-lg-4 lambda";
  col.appendChild(panel);
  $(col).data(data);
  panel.className = "panel panel-default";
  panel.appendChild(heading);
  panel.appendChild(content);
  heading.className = "panel-heading";
  close.innerHTML = "&times;";
  close.type = "button";
  close.className = "close";
  close.onclick = function() {
    col.remove();
    checkVisibility();
  };
  heading.appendChild(close);
  title.className = "panel-title";
  title.innerText = data.name;
  heading.appendChild(title);
  content.className = "panel-body";
  pre.innerHTML = JSON.stringify(data.data, null, 4);
  content.appendChild(pre);
  document.getElementById("lambdas").appendChild(col);
  checkVisibility();
  return col;
}


function run(lambda, options) {
  var deferred = $.Deferred(),
      errors = [],
      success = [],
      global = new Date(),
      loop = function(left) {
        deferred.notify({
          left: left,
          total: options.iterations,
          name: options.name
        });
        var start = new Date();
        lambda(options.name, options.data)
          .fail(function(err) {
            var duration = new Date() - start;
            errors.push({
              time: duration,
              data: err
            });
            success.push(null);
          })
          .done(function(data) {
            var duration = new Date() - start;
            success.push({
              time: duration,
              data: data
            });
            errors.push(null);
          })
          .always(function() {
            if (left > 0) {
              setTimeout(function() {
                  loop(left-1);
              }, options.delay);
            } else {
              deferred.resolve({
                context: options,
                success: success,
                errors: errors,
                totalTime: new Date() - global
              });
            }
          });
    };
  setTimeout(function() {
      loop(options.iterations - 1);
  });
  return deferred.promise();
}

function getStoreIndex() {
  var existing = localStorage.getItem("lambdas");
  if (!existing) {
    existing = [];
  } else {
    existing = JSON.parse(existing);
  }
  return existing;
}

function storeOptions(ops) {
  localStorage.setItem("lambda-"+ops.name, JSON.stringify(ops.data));

  var existing = getStoreIndex();

  existing.push(ops.name);
  localStorage.setItem("lambdas", JSON.stringify(existing));
}

function recoverOptions() {
  var index = getStoreIndex();

  return index.map(function(name) {
    return {
      name: name,
      data: JSON.parse(localStorage.getItem("lambda-"+name))
    }
  });
}

function clearOptions() {
  var ops = getStoreIndex();
  ops.forEach(function(name) {
    localStorage.removeItem("lambda-"+name);
  });
  localStorage.removeItem("lambdas");
}

function test(lambda, iterations, delay) {
  document.getElementById("progress").innerHTML = "";
  clearOptions();
  var lambdas = $(".lambda").map(function() {
    var $el = $(this),
        options = {
          iterations: iterations,
          delay: delay,
          name: $el.data("name"),
          data: $el.data("data")
        },
        promise = run(lambda, options);
      storeOptions(options);
      var TPL = [
              '<hr/>',
              '<h5></h5>',
              '<div class="progress">',
              '<div class="progress-bar" style="width: 0%;"></div>',
              '</div>'
            ].join(''),
          root = document.createElement("div"),
          $root = $(root).addClass("lambda-progress").html(TPL);

      $root.children("h5").text(options.name);

      promise.progress(function(data) {
        var pct = (data.total - data.left) / data.total;
        $root.find(".progress-bar").css("width", (pct * 100) + "%");
      });

      document.getElementById("progress").appendChild(root);
      return promise;
  });
  $.when.apply($,lambdas)
    .done(showReport)
}

function analysis(data) {
  return "max: " + _.max(data) + "ms; " +
    "min: " + _.min(data) + "ms; " +
    "average: " + _.average(data) + "ms; " +
    "median: " + _.median(data) + "ms; " +
    "stdDev: " + _.stdDeviation(data) + "ms";
}

function drawChart(placeholder, data) {
  nv.addGraph(function() {
    var chart = nv.models.lineChart()
                  .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
                  .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                  .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                  .showYAxis(true)        //Show the y-axis
                  .showXAxis(true)        //Show the x-axis
                  .options({
                    duration: 350
                  });

    chart.xAxis     //Chart x-axis settings
        .axisLabel('Iteration');

    chart.yAxis     //Chart y-axis settings
        .axisLabel('Time (ms)')
        .tickFormat(d3.format(',r'));

    d3.select(placeholder)    //Select the <svg> element you want to render the chart in.
        .datum(data)         //Populate the <svg> element with chart data...
        .call(chart);          //Finally, render the chart!

    //Update the chart when window resizes.
    nv.utils.windowResize(function() { chart.update() });

    return chart;
  });
}

function showReport() {
  $("#loading").hide();
  $("#results").show();

  var results = Array.prototype.slice.call(arguments),
      totals = _.pluck(results, "totalTime"),
      successTS = [],
      errorsTS = [];

  var str = [
    "Tests execution time: ",
    "----------------------------",
    analysis(totals)
  ];

  _.each(results, function(exec) {
    var success = _(exec.success).compact().pluck("time").value(),
        errors = _(exec.errors).compact().pluck("time").value(),
        times = success.concat(errors),
        remoteTimes = _(exec.success).compact().pluck('data').pluck('time').value();

      str.push("\nFunction '"+exec.context.name + "' ( success: "+success.length+", errors: "+errors.length+")");
      str.push("----------------------------");

      if (success.length && errors.length)
      str.push("Globals: "+analysis(times));

      if (success.length)
      str.push("Success: "+analysis(success));
      str.push("Remote:"+analysis(remoteTimes));

      if (errors.length)
      str.push("Errors: "+analysis(errors));

      successTS.push({
        key: exec.context.name,
        values: _.pluck(exec.success, "time").map(function(v, i) {
          return {
              y: v == null ? -1 : v,
              x: i
          }
        })
      });

      successTS.push({
        key: 'Remote time for '+exec.context.name,
        values: _(exec.success).pluck('data').pluck('time').map(function(v,i) {
          return { y: v == null ? -1 : v, x: i }
        }).value()
      });

      errorsTS.push({
        key: exec.context.name,
        values: _.pluck(exec.errors, "time").map(function(v, i) {
          return {
              y: v == null ? -1 : v,
              x: i
          }
        })
      });
  });
  $("#resume-text").html(str.join("\n"));

  $("#success-chart").html("<svg></svg>");
  drawChart("#success-chart svg", successTS);

  $("#errors-chart").html("<svg></svg>");
  drawChart("#errors-chart svg", errorsTS);
}

$("#finish").click(function() {
  $("#results").hide();
  $("#config").show();
});

document.forms.add.onsubmit = function(ev) {
  ev.preventDefault();

  var data;

  if (!this.name.value) {
    addError("Lambda name should not be blank");
    return;
  }

  try {
    data = JSON.parse(this.data.value);
  } catch (e) {
    console.error("Invalid JSON data", e);
    addError("Lambda data should be a valid JSON");
    return;
  }

  addLambda({
    name : this.name.value,
    data : data
  });

  this.reset();
}

document.forms.test.delay.value = localStorage.getItem("exec-delay") || 1;
document.forms.test.count.value = localStorage.getItem("exec-count") || 50;
document.forms.test.aws_id.value = localStorage.getItem("aws-id") || "";
document.forms.test.aws_secret.value = localStorage.getItem("aws-secret") || "";
document.forms.test.aws_region.value = localStorage.getItem("aws-region") || 'eu-west-1';

recoverOptions().forEach(addLambda);


document.forms.test.onsubmit = function(ev) {
  ev.preventDefault();

  var iterations = parseInt(this.count.value, 10),
      delay = parseInt(this.delay.value, 10),
      aws_id = this.aws_id.value,
      aws_secret = this.aws_secret.value,
      aws_region = this.aws_region.value;

  if (isNaN(iterations)) {
    addError("Count should be a intenger");
  } else if (iterations < 1) {
    addError("Iterations should be a positive integer");
  } else if (isNaN(delay)) {
    addError("Delay should be an integer");
  } else if (delay < 0) {
    addError("Delay should be greater than 0");
  } else if (!aws_region) {
    addError("AWS region should be a non empty string");
  } else if (!aws_id) {
    addError("AWS ID should be a non empty string");
  } else if (!aws_secret) {
    addError("AWS SECRET should be a non empty string");
  } else {
    $("#loading").show();
    $("#config").hide();
    var lambda = LambdaFactory({
        AWS_ID: aws_id,
        AWS_SECRET: aws_secret,
        AWS_REGION: aws_region
    });
    localStorage.setItem("aws-id",aws_id);
    localStorage.setItem("aws-secret",aws_secret);
    localStorage.setItem("exec-delay",delay);
    localStorage.setItem("exec-count",iterations);
    localStorage.setItem("aws-region",aws_region);
    test(lambda, iterations, delay);
  }
};
