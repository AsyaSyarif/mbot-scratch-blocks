var myInterpreter;
var waitStep = 0;
var glowingId = null;
var currentlyGlowingStack = null;
var exitInterpreter = false;
var interpreterTimer = null;

var eventTriggered = false;

function stepCode(triggered) {
  exitInterpreter = false;
  if (eventTriggered && triggered)
  return;

  eventTriggered = triggered;
  //
  // if (highlighting) {
  Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
  Blockly.JavaScript.addReservedWords('highlightBlock');
  // } else {
  //   Blockly.JavaScript.STATEMENT_PREFIX = null;
  // }


  var code = "";
  var distanceFunction = "";

  for (i = 0; i < workspace.getTopBlocks().length; i++) {
    if (workspace.getTopBlocks()[i].type === "event_whenflagclicked")
      code += Blockly.JavaScript.blockToCode(workspace.getTopBlocks()[i]);
    else if (workspace.getTopBlocks()[i].type === "mbot_whendistanceclose")
      distanceFunction += Blockly.JavaScript.blockToCode(workspace.getTopBlocks()[i]);
  }

  if (eventTriggered) {
    code = distanceFunction;
  }

  myInterpreter = new Interpreter(code, initApi);
  resetTimeout();
  nextStep();

  workspace.highlightBlock(null);

}

function stopInterpreter() {
  exitInterpreter = true;
}

function resetTimeout() {
  if (interpreterTimer == null)
    return;

  clearTimeout(interpreterTimer);
  interpreterTimer = null;

}

function nextStep() {
  try {
    if (!exitInterpreter && myInterpreter.step()) {
      resetTimeout();
      interpreterTimer = window.setTimeout(nextStep, waitStep);

      waitStep = 0;
    } else {

      exitInterpreter = false;
      eventTriggered = false;
      resetTimeout();
      var block = workspace.getBlockById(glowingId);
      if (block) {
        block.setGlowBlock(false);
      }
      if (workspace.getBlockById(currentlyGlowingStack))
        workspace.glowStack(currentlyGlowingStack, false);

      currentlyGlowingStack = null;
      setMotors(0,0);
    }
  } catch (e) {
    console.log(e);
  }
}

function highlightBlock(id) {
  var block = workspace.getBlockById(glowingId);

  if (block) {
    block.setGlowBlock(false);
  }

  block = workspace.getBlockById(id);
  if (block) {
    block.setGlowBlock(true);
    glowingId = id;

    if (block.type == "event_whenflagclicked" || block.type == "mbot_whendistanceclose") {
      if (id != currentlyGlowingStack) {
        if (currentlyGlowingStack != undefined)
          workspace.glowStack(currentlyGlowingStack, false);

        workspace.glowStack(id, true);
        currentlyGlowingStack = id;
      }
    }
  }
}

function wait(ms) {
  waitStep = ms * 1000;
}

/*
  Define your API for the Interpreter
  https://developers.google.com/blockly/guides/app-integration/running-javascript#js_interpreter
*/

function initApi(interpreter, scope) {
  // Add an API function for highlighting blocks.
  var wrapper = function(id) {
    id = id ? id.toString() : '';
    return interpreter.createPrimitive(highlightBlock(id));
  };
  interpreter.setProperty(scope, 'highlightBlock',
      interpreter.createNativeFunction(wrapper));

  // Add an API function for "wait" blocks.
  var wrapper = function(id) {
    id = id ? id.toString() : '';
    return interpreter.createPrimitive(wait(id));
  };
  interpreter.setProperty(scope, 'wait',
      interpreter.createNativeFunction(wrapper));

  // Add an API function for the "alert" block.
  wrapper = function(text) {
    text = text ? text.toString() : '';
    return interpreter.createPrimitive(alert(text));
  };
  interpreter.setProperty(scope, 'alert',
  interpreter.createNativeFunction(wrapper));

  // Add an API function for the "prompt" block.
  wrapper = function(msg) {
    msg = msg ? msg.toString() : '';
    return interpreter.createPrimitive(prompt(msg));
  };
  interpreter.setProperty(scope, 'prompt',
  interpreter.createNativeFunction(wrapper));

  // Add an API function for the "setLed" block.
  wrapper = function(colorName) {
    colorName = colorName ? colorName.toString() : '';
    return interpreter.createPrimitive(setLed(colorName));
  };
  interpreter.setProperty(scope, 'setLed',
  interpreter.createNativeFunction(wrapper));

  // Add an API function for the "setMotorsSpeed" block.
  wrapper = function(speed) {
    speed = speed ? speed.toString() : '';
    return interpreter.createPrimitive(setMotorsSpeed(speed));
  };
  interpreter.setProperty(scope, 'setMotorsSpeed',
  interpreter.createNativeFunction(wrapper));

  // Add an API function for the "setMotors" block.
  wrapper = function(l, r, d) {
    return interpreter.createPrimitive(setMotors(l , r));
  };
  interpreter.setProperty(scope, 'setMotors',
  interpreter.createNativeFunction(wrapper));
  // Add an API function for the "stopInterpreter" block.
  wrapper = function() {
    return interpreter.createPrimitive(stopInterpreter());
  };
  interpreter.setProperty(scope, 'stopInterpreter',
  interpreter.createNativeFunction(wrapper));
  // Add an API function for the "restart" block.
  wrapper = function() {
    return interpreter.createPrimitive(stepCode(false));
  };
  interpreter.setProperty(scope, 'restart',
  interpreter.createNativeFunction(wrapper));
}
