RMS.LoadLibrary("rmgen");

// terrain textures
const tGrass = ["medit_grass_field_a", "medit_grass_field_b"];
const tGrassForest = "medit_grass_wild";
const tCliff = ["medit_cliff_italia", "medit_cliff_italia_grass"];
const tGrassDirt75 = "medit_dirt";
const tGrassDirt50 = "medit_dirt_b";
const tGrassDirt25 = "medit_dirt_c";
const tDirt = "medit_dirt_b";
const tGrassPatch = "medit_grass_wild";
const tShoreBlend = "medit_grass_field_brown";
const tShore = "medit_riparian_mud";
const tWater = "medit_riparian_mud";

// gaia entities
const oOak = "gaia/flora_tree_oak";
const oOakLarge = "gaia/flora_tree_oak_large";
const oApple = "gaia/flora_tree_apple";
const oPine = "gaia/flora_tree_pine";
const oAleppoPine = "gaia/flora_tree_aleppo_pine";
const oBerryBush = "gaia/flora_bush_berry";
const oSheep = "gaia/fauna_sheep";
const oDeer = "gaia/fauna_deer";
const oStone = "gaia/geology_stone_mediterranean";
const oMetal = "gaia/geology_metal_mediterranean_slabs";

// decorative props
const aGrass = "actor|props/flora/grass_soft_large_tall.xml";
const aGrassShort = "actor|props/flora/grass_soft_large.xml";
const aReeds = "actor|props/flora/reeds_pond_lush_a.xml";
const aLillies = "actor|props/flora/pond_lillies_large.xml";
const aRockLarge = "actor|geology/stone_granite_large.xml";
const aRockMedium = "actor|geology/stone_granite_med.xml";
const aBushMedium = "actor|props/flora/bush_medit_me.xml";
const aBushSmall = "actor|props/flora/bush_medit_sm.xml";

// terrain + entity (for painting)
const pForestD = [tGrassForest + TERRAIN_SEPARATOR + oOak, tGrassForest + TERRAIN_SEPARATOR + oOakLarge];
const pForestP = [tGrassForest + TERRAIN_SEPARATOR + oPine, tGrassForest + TERRAIN_SEPARATOR + oAleppoPine];

// initialize map

log("Initializing map...");

InitMap();

var numPlayers = getNumPlayers();
var mapSize = getMapSize();
var mapArea = mapSize*mapSize;

// create tile classes

var clPlayer = createTileClass();
var clHill = createTileClass();
var clForest = createTileClass();
var clWater = createTileClass();
var clDirt = createTileClass();
var clRock = createTileClass();
var clMetal = createTileClass();
var clFood = createTileClass();
var clBaseResource = createTileClass();
var clSettlement = createTileClass();

// place players

var playerX = new Array(numPlayers+1);
var playerZ = new Array(numPlayers+1);
var playerAngle = new Array(numPlayers+1);

var startAngle = randFloat() * 2 * PI;
for (var i = 1; i <= numPlayers; i++)
{
	playerAngle[i] = startAngle + i*2*PI/numPlayers;
	playerX[i] = 0.5 + 0.35*cos(playerAngle[i]);
	playerZ[i] = 0.5 + 0.35*sin(playerAngle[i]);
}

for (var i = 1; i <= numPlayers; i++)
{
	log("Creating base for player " + i + "...");
	
	// some constants
	var radius = 17;
	var cliffRadius = 2;
	var elevation = 20;
	
	// get the x and y in tiles
	var fx = fractionToTiles(playerX[i]);
	var fz = fractionToTiles(playerZ[i]);
	var ix = round(fx);
	var iz = round(fz);

	// calculate size based on the radius
	var size = PI * radius * radius;
	
	// create the hill
	var placer = new ClumpPlacer(size, 0.95, 0.6, 0, ix, iz);
	var terrainPainter = new LayeredPainter(
		[tCliff, tGrass],		// terrains
		[cliffRadius]		// widths
	);
	var elevationPainter = new SmoothElevationPainter(
		ELEVATION_SET,			// type
		elevation,				// elevation
		cliffRadius				// blend radius
	);
	createArea(placer, [terrainPainter, elevationPainter, paintClass(clPlayer)], null);
	
	// create the ramp
	var rampAngle = playerAngle[i] + PI + (2*randFloat()-1)*PI/8;
	var rampDist = radius;
	var rampX = round(fx + rampDist * cos(rampAngle));
	var rampZ = round(fz + rampDist * sin(rampAngle));
	placer = new ClumpPlacer(100, 0.9, 0.5, 0, rampX, rampZ);
	var painter = new SmoothElevationPainter(ELEVATION_SET, elevation-6, 5);
	createArea(placer, painter, null);
	placer = new ClumpPlacer(75, 0.9, 0.5, 0, rampX, rampZ);
	painter = new TerrainPainter(tGrass);
	createArea(placer, painter, null);
	
	// create the central dirt patch
	placer = new ClumpPlacer(PI*3.5*3.5, 0.3, 0.1, 0, ix, iz);
	painter = new LayeredPainter(
		[tGrassDirt75, tGrassDirt50, tGrassDirt25, tDirt],		// terrains
		[1,1,1]									// widths
	);
	createArea(placer, painter, null);
	
	// create the TC and citizens
	var civ = getCivCode(i - 1);
	var group = new SimpleGroup(	// elements (type, min/max count, min/max distance)
		[new SimpleObject("structures/"+civ+"_civil_centre", 1,1, 0,0), new SimpleObject("units/"+civ+"_support_female_citizen", 3,3, 5,5)],
		true, null, ix, iz
	);
	createObjectGroup(group, i);
	
	// create berry bushes
	var bbAngle = randFloat()*2*PI;
	var bbDist = 9;
	var bbX = round(fx + bbDist * cos(bbAngle));
	var bbZ = round(fz + bbDist * sin(bbAngle));
	group = new SimpleGroup(
		[new SimpleObject(oBerryBush, 5,5, 0,2)],
		true, clBaseResource, bbX, bbZ
	);
	createObjectGroup(group, 0);
	
	// create metal mine
	var mAngle = bbAngle;
	while(abs(mAngle - bbAngle) < PI/3)
	{
		mAngle = randFloat()*2*PI;
	}
	var mDist = 11;
	var mX = round(fx + mDist * cos(mAngle));
	var mZ = round(fz + mDist * sin(mAngle));
	group = new SimpleGroup(
		[new SimpleObject(oMetal, 1,1, 0,0)],
		true, clBaseResource, mX, mZ
	);
	createObjectGroup(group, 0);
	
	// create stone mines
	mAngle += randFloat(PI/8, PI/4);
	mX = round(fx + mDist * cos(mAngle));
	mZ = round(fz + mDist * sin(mAngle));
	group = new SimpleGroup(
		[new SimpleObject(oStone, 2,2, 0,1)],
		true, clBaseResource, mX, mZ
	);
	createObjectGroup(group, 0);
	
	// create starting straggler trees
	group = new SimpleGroup(
		[new SimpleObject(oOak, 5,5, 8,12)],
		true, clBaseResource, ix, iz
	);
	createObjectGroup(group, 0, avoidClasses(clBaseResource,2));
	
	// create grass tufts
	for (var j = 0; j < 10; j++)
	{
		var gAngle = randFloat()*2*PI;
		var gDist = 6 + randInt(9);
		var gX = round(fx + gDist * cos(gAngle));
		var gZ = round(fz + gDist * sin(gAngle));
		group = new SimpleGroup(
			[new SimpleObject(aGrassShort, 2,5, 0,1, -PI/8,PI/8)],
			false, clBaseResource, gX, gZ
		);
		createObjectGroup(group, undefined);
	}
}

RMS.SetProgress(5);

// create lakes
log("Creating lakes...");
placer = new ClumpPlacer(mapArea * 0.003, 0.8, 0.1, 0);
terrainPainter = new LayeredPainter(
	[tShoreBlend, tShore, tWater],		// terrains
	[1,1]							// widths
);
elevationPainter = new SmoothElevationPainter(ELEVATION_SET, -7, 3);
var waterAreas = createAreas(
	placer,
	[terrainPainter, elevationPainter, paintClass(clWater)], 
	avoidClasses(clPlayer, 2, clWater, 20),
	round(1.3 * numPlayers)
);

// create reeds
log("Creating reeds...");
group = new SimpleGroup(
	[new SimpleObject(aReeds, 5,10, 0,4), new SimpleObject(aLillies, 1,1, 0,4)], true
);
createObjectGroupsByAreas(group, undefined,
	[new BorderTileClassConstraint(clWater, 3, 0), stayClasses(clWater, 1)],
	10 * numPlayers, 100,
	waterAreas
);
waterAreas = [];

RMS.SetProgress(22);

// create bumps
log("Creating bumps...");
placer = new ClumpPlacer(mapArea * 0.000229 + 10, 0.3, 0.06, 0);
painter = new SmoothElevationPainter(ELEVATION_MODIFY, 2, 2);
createAreas(
	placer,
	painter, 
	avoidClasses(clWater, 2, clPlayer, 0),
	44
);

RMS.SetProgress(25);

// create hills
log("Creating hills...");
placer = new ClumpPlacer(mapArea * 0.000688 + 20, 0.2, 0.1, 0);
terrainPainter = new LayeredPainter(
	[tCliff, [tGrass,tGrass,tGrassDirt75]],		// terrains
	[2]								// widths
);
elevationPainter = new SmoothElevationPainter(ELEVATION_SET, 12, 2);
var hillAreas = createAreas(
	placer,
	[terrainPainter, elevationPainter, paintClass(clHill)], 
	avoidClasses(clPlayer, 2, clWater, 5, clHill, 15),
	3 * numPlayers
);

RMS.SetProgress(30);

// calculate desired number of trees for map (based on size)
const MIN_TREES = 300;
const MAX_TREES = 1500;
const P_FOREST = 0.7;

var totalTrees = MIN_TREES + (MAX_TREES - MIN_TREES) / 384 * (mapSize - 128);
var numForest = totalTrees * P_FOREST;
var numStragglers = totalTrees * (1.0 - P_FOREST);

// create forests
log("Creating forests...");
var types = [pForestD, pForestP];	// some variation
var size = numForest / (2 * numPlayers);
var num = floor(size / types.length);
for (var i = 0; i < types.length; ++i)
{
	placer = new ClumpPlacer(numForest / num, 0.1, 0.1, 0);
	painter = new LayeredPainter(
		[[tGrassForest, tGrass, types[i]], [tGrassForest, types[i]]],		// terrains
		[2]											// widths
		);
	createAreas(
		placer,
		[painter, paintClass(clForest)], 
		avoidClasses(clPlayer, 1, clWater, 3, clForest, 10, clHill, 0),
		num
	);
}

RMS.SetProgress(53);

log("Placing stone mines...");
// create stone
group = new SimpleGroup([new SimpleObject(oStone, 2,2, 0,8)], true, clRock);
createObjectGroupsByAreas(group, 0,
	[avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clRock, 15), 
	 new BorderTileClassConstraint(clHill, 0, 4)],
	4 * numPlayers, 100,
	hillAreas
);

log("Placing metal mines...");
// create metal
group = new SimpleGroup([new SimpleObject(oMetal, 1,1, 0,8)], true, clMetal);
createObjectGroupsByAreas(group, 0,
	[avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clMetal, 15, clRock, 5), 
	 new BorderTileClassConstraint(clHill, 0, 4)],
	4 * numPlayers, 100,
	hillAreas
);
hillAreas = [];

// create dirt patches
log("Creating dirt patches...");
var sizes = [0.000183, 0.000321, 0.000458];
for (var i = 0; i < sizes.length; i++)
{
	placer = new ClumpPlacer(mapArea * sizes[i], 0.3, 0.06, 0);
	painter = new LayeredPainter(
		[[tGrass,tGrassDirt75],[tGrassDirt75,tGrassDirt50], [tGrassDirt50,tGrassDirt25]], 		// terrains
		[1,1]															// widths
	);
	createAreas(
		placer,
		[painter, paintClass(clDirt)],
		avoidClasses(clWater, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 0),
		11
	);
}

// create grass patches
log("Creating grass patches...");
var sizes = [0.000115, 0.000206, 0.000298];
for (var i = 0; i < sizes.length; i++)
{
	placer = new ClumpPlacer(mapArea * sizes[i], 0.3, 0.06, 0);
	painter = new TerrainPainter(tGrassPatch);
	createAreas(
		placer,
		painter,
		avoidClasses(clWater, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 0),
		11
	);
}

// create settlements
// log("Creating settlements...");
// group = new SimpleGroup([new SimpleObject("gaia/special_settlement", 1,1, 0,0)], true, clSettlement);
// createObjectGroups(group, 0,
	// avoidClasses(clWater, 0, clForest, 0, clPlayer, 15, clHill, 0, clRock, 5, clSettlement, 35),
	// 2 * numPlayers, 50
// );

RMS.SetProgress(60);

// create small decorative rocks
log("Creating large decorative rocks...");
group = new SimpleGroup(
	[new SimpleObject(aRockMedium, 1,3, 0,1)],
	true
);
createObjectGroups(
	group, undefined,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0),
	mapArea/1000, 50
);

// create large decorative rocks
log("Creating large decorative rocks...");
group = new SimpleGroup(
	[new SimpleObject(aRockLarge, 1,2, 0,1), new SimpleObject(aRockMedium, 1,3, 0,2)],
	true
);
createObjectGroups(
	group, undefined,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0),
	mapArea/2000, 50
);

// create deer
log("Creating deer...");
group = new SimpleGroup(
	[new SimpleObject(oDeer, 5,7, 0,4)],
	true, clFood
);
createObjectGroups(group, 0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0, clFood, 20),
	3 * numPlayers, 50
);

// create sheep
log("Creating sheep...");
group = new SimpleGroup(
	[new SimpleObject(oSheep, 2,3, 0,2)],
	true, clFood
);
createObjectGroups(group, 0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0, clFood, 20),
	3 * numPlayers, 50
);

// create straggler trees
log("Creating straggler trees...");
var types = [oOak, oOakLarge, oPine, oApple];	// some variation
var num = floor(numStragglers / types.length);
for (var i = 0; i < types.length; ++i)
{
	group = new SimpleGroup(
		[new SimpleObject(types[i], 1,1, 0,3)],
		true
	);
	createObjectGroups(group, 0,
		avoidClasses(clWater, 1, clForest, 1, clHill, 1, clPlayer, 1),
		num
	);
}

//create small grass tufts
log("Creating small grass tufts...");
group = new SimpleGroup(
	[new SimpleObject(aGrassShort, 1,2, 0,1, -PI/8,PI/8)]
);
createObjectGroups(group, undefined,
	avoidClasses(clWater, 2, clHill, 2, clPlayer, 2, clDirt, 0),
	mapArea * 0.000763
);

RMS.SetProgress(80);

// create large grass tufts
log("Creating large grass tufts...");
group = new SimpleGroup(
	[new SimpleObject(aGrass, 2,4, 0,1.8, -PI/8,PI/8), new SimpleObject(aGrassShort, 3,6, 1.2,2.5, -PI/8,PI/8)]
);
createObjectGroups(group, undefined,
	avoidClasses(clWater, 3, clHill, 2, clPlayer, 2, clDirt, 1, clForest, 0),
	mapArea * 0.000763
);

RMS.SetProgress(87);

// create bushes
log("Creating bushes...");
group = new SimpleGroup(
	[new SimpleObject(aBushMedium, 1,2, 0,2), new SimpleObject(aBushSmall, 2,4, 0,2)]
);
createObjectGroups(group, undefined,
	avoidClasses(clWater, 1, clHill, 1, clPlayer, 1, clDirt, 1),
	mapArea * 0.000763, 50
);

// Set environment
setSkySet("cirrus");
setWaterTint(0.447, 0.412, 0.322);				// muddy brown
setWaterReflectionTint(0.447, 0.412, 0.322);	// muddy brown
setWaterMurkiness(1.0);
setWaterReflectionTintStrength(0.677);

// Export map data
ExportMap();
