// Various utility functions that may need to be accessed from more than one file

// Takes a color in hsl representation, and gives the associated rgb values
// From: http://jsfiddle.net/AbdiasSoftware/HCetQ/
function hsl2rgb(h, s, l) {   
    var r, g, b, q, p;
    
    h /= 360;
    
    if (s == 0) {
        r = g = b = l;
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t++;
            if (t > 1) t--;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        
        q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: r * 255,
        g: g * 255,
        b: b * 255};
}

// Create a new unit based on a reference unit
function copyUnit(ref) {
	var u = new Unit(ref.playerID, ref.ID);
	u.cost = ref.cost;
	u.pos = ref.pos;
	u.angle = ref.angle;
	u.maxHealth = ref.maxHealth;
	u.health = ref.health;
	u.regen = ref.regen;
	u.reward = ref.reward;
	u.speed = ref.speed;
	u.destination = (ref.destination == null)? null : {x: ref.destination.x, y: ref.destination.y};
	u.range = ref.range;
	u.damage = ref.damage;
	u.attackSpeed = ref.attackSpeed;
	u.timeSinceLastAttack = ref.timeSinceLastAttack;
	return u;
}

// Create a new building based on a reference building
function copyBuilding(ref) {
	var typeClass = Mine;
	if (ref.type == 'tower')
		typeClass = Tower;
	else if (ref.type == 'fortress')
		typeClass = Fortress;
	
	var b = new typeClass(ref.playerID, ref.ID);
	b.maxHealth = ref.maxHealth;
	b.health = ref.health;
	b.regen = ref.regen;
	b.hex = ref.hex;
	b.pos = ref.pos;
	b.cost = ref.cost;
	b.type = ref.type;
	b.reward = ref.reward;
	if (b.type == 'mine' || b.type == 'fortress')
		b.yield = ref.yield;
	else if (b.type == 'tower' || b.type == 'fortress') {
		b.range = ref.range;
		b.damage = ref.damage;
		b.attackSpeed = ref.attackSpeed;
		b.timeSinceLastAttack = ref.timeSinceLastAttack;
	}
	return b;
}

// Create a new player based on a reference player
function copyPlayer(ref) {
	var p = new Player(ref.ID);
	p.ID = ref.ID;
	p.hue = ref.hue;
	p.rgb = ref.rgb;
	p.rgbOpposite = ref.rgbOpposite;
	p.color = ref.color;
	p.colorOpposite = ref.colorOpposite;
	p.nextUnitID = ref.nextUnitID;
	p.maxUnits = ref.maxUnits;
	p.gold = ref.gold;
	p.nextBuildingID = ref.nextBuildingID;
	
	for (var i = 0; i < ref.units.length; i++)
		p.units.push(copyUnit(ref.units[i]));
	for (var i = 0; i < ref.buildings.length; i++)
		p.buildings.push(copyBuilding(ref.buildings[i]));
	return p;
}

// Calculates the square of the distance between two points
function distanceSquared(start, end) {
	var dx = end.x - start.x;
	var dy = end.y - start.y;
	return dx * dx + dy * dy;
}