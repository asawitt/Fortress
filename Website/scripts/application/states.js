var states = new Array();

function addState(state)
{
	if(state instanceof (State))
	{
		states.push(state);
		state.init();
	}
}

function removeStates()
{
	for(var i = 0; i < states.length; i++)
	{
		if(states[i].remove)
		{
			states[i].remove = false;
			states[i].destroy();
			states.splice(i, 1);
			i--;
		}
	}
}

var State = function() {};
State.prototype = 
{
	draw: function() {},
    update: function(delta) {},
    init: function() {},
    destroy: function() {},
    keyDown: function(event){},
    keyUp: function(event){},
    mouseDown: function(event){},
    mouseUp: function(event){},
    mouseMove: function(event){},
    mouseWheel: function(event){},
    mouseOut: function(event){},
    remove: false
};