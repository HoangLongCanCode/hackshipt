// More demo quests spread across Birmingham's neighborhoods (not just downtown).
// FICTIONAL: sites are approximate neighborhood centers, organizations have not endorsed this app.
// category: education | food | farm | tech | seniors | community
module.exports = (q) => [
  // West: Ensley / Wylam / Bush Hills / Fairview
  q("x-ensley-pantry", "firehouse", "Ensley Pantry Shelf Stock", "Unload, date-check and shelve donations so Saturday's pantry line moves fast.", "food", "food,community", 33.5112, -86.8902, "Ensley (demo site)", 1, 60, 5, "5101"),
  q("x-wylam-garden", "farm", "Wylam Community Garden Beds", "Turn compost, build two raised beds and plant greens with neighbors.", "farm", "gardening,outdoors", 33.4986, -86.9314, "Wylam (demo site)", 2, 120, 8, "5102"),
  q("x-bush-read", "promise", "Bush Hills Reading Buddies", "Read aloud with early elementary students. Funny voices strongly encouraged.", "education", "teaching,community", 33.5119, -86.8626, "Bush Hills (demo site)", 1, 45, 4, "5103"),
  q("x-fairview-seniors", "edfarm", "Fairview Tablet Tutor", "Help older neighbors set up video calls with family. Patience is the only skill needed.", "seniors", "seniors,tech,teaching", 33.5061, -86.8718, "Fairview (demo site)", 1, 60, 3, "5104"),
  q("x-oakridge-cleanup", "farm", "Oak Ridge Lot Cleanup", "Bag litter, pull weeds and haul brush from a vacant lot that will become a pocket park.", "community", "outdoors,community", 33.5276, -86.9247, "Oak Ridge (demo site)", 2, 90, 10, "5105"),
  // North / Northwest
  q("x-hooper-meals", "firehouse", "Hooper City Meal Boxes", "Pack and hand out meal boxes to families on the route.", "food", "food,community", 33.5837, -86.8504, "Hooper City (demo site)", 2, 90, 6, "5106"),
  q("x-fairmont-homework", "promise", "Fairmont Homework Club", "Small-group math and reading help after school.", "education", "teaching", 33.5777, -86.8150, "Fairmont (demo site)", 1, 60, 4, "5107"),
  q("x-nbham-lab", "edfarm", "North Bham Digital Open Lab", "Drop-in help with email, résumés and online job applications.", "tech", "tech,community", 33.5511, -86.8219, "North Birmingham (demo site)", 2, 90, 4, "5108"),
  q("x-collegeville-closet", "firehouse", "Collegeville Coat Drive Sort", "Sort, mend and rack winter coats before the giveaway.", "community", "community", 33.5553, -86.8028, "Collegeville (demo site)", 1, 60, 6, "5109"),
  q("x-sandusky-farm", "farm", "Sandusky Pop-up Farm Stand", "Set up a produce stand, chat with customers and bag orders.", "farm", "gardening,food,community", 33.5453, -86.8996, "Sandusky (demo site)", 1, 90, 5, "5110"),
  q("x-thomas-mentor", "edfarm", "Thomas Code Club Helper", "Help kids build a first tiny game in Scratch.", "tech", "tech,teaching", 33.5307, -86.8620, "Thomas (demo site)", 2, 75, 4, "5111"),
  // East: Woodlawn / East Lake / Eastwood / Crestwood
  q("x-woodlawn-mural", "promise", "Woodlawn Mural Paint Day", "Help students paint a block-long mural. Old clothes recommended.", "community", "music,community,outdoors", 33.5552, -86.7491, "Woodlawn (demo site)", 2, 120, 12, "5112"),
  q("x-eastlake-pantry", "firehouse", "East Lake Pantry Helper", "Greet neighbors, carry bags, restock produce.", "food", "food,community", 33.5494, -86.7296, "East Lake (demo site)", 1, 75, 5, "5113"),
  q("x-eastwood-garden", "farm", "Eastwood Orchard Pruning", "Prune and mulch young fruit trees with an orchard volunteer lead.", "farm", "gardening,outdoors", 33.5264, -86.7124, "Eastwood (demo site)", 3, 120, 6, "5114"),
  q("x-crestwood-seniors", "edfarm", "Crestwood Phone Help Hour", "One-on-one: photos, texting and staying in touch for older neighbors.", "seniors", "seniors,tech", 33.5323, -86.7491, "Crestwood (demo site)", 1, 60, 3, "5115"),
  q("x-kingston-read", "promise", "Kingston Story Hour", "Read and do a simple craft with kindergarteners.", "education", "teaching,music", 33.5424, -86.7722, "Kingston (demo site)", 1, 45, 4, "5116"),
  q("x-inglenook-trail", "farm", "Inglenook Park Trail Day", "Clear a short trail, spread mulch and fix a bench.", "community", "outdoors", 33.5665, -86.7724, "Inglenook (demo site)", 3, 120, 10, "5117"),
  q("x-zion-meal", "firehouse", "Zion City Supper Serving", "Serve a community supper and sit down to eat with guests.", "food", "food,seniors,community", 33.5860, -86.7260, "Zion City (demo site)", 1, 90, 8, "5118"),
  q("x-roebuck-tutor", "promise", "Roebuck Math Tutors", "Help middle schoolers with fractions and a lot of encouragement.", "education", "teaching", 33.5947, -86.7120, "Roebuck (demo site)", 2, 60, 4, "5119"),
  q("x-airport-devices", "edfarm", "Airport Highlands Device Setup", "Update and label donated laptops for families who need them.", "tech", "tech,community", 33.5826, -86.7415, "Airport Highlands (demo site)", 2, 90, 5, "5120"),
  // Far east / north-east
  q("x-huffman-garden", "farm", "Huffman School Garden Planting", "Plant a fall bed with a class and help label everything.", "farm", "gardening,teaching", 33.5963, -86.6648, "Huffman (demo site)", 1, 90, 6, "5121"),
  q("x-sunvalley-clean", "farm", "Sun Valley Creek Cleanup", "Wade in, pick up trash and sort recycling along a small creek.", "community", "outdoors,community", 33.6521, -86.7054, "Sun Valley (demo site)", 3, 120, 10, "5122"),
  q("x-liberty-seniors", "firehouse", "Liberty Highlands Friendly Visits", "Short visits and a hot lunch for neighbors who live alone.", "seniors", "seniors,food,community", 33.5801, -86.6408, "Liberty Highlands (demo site)", 1, 60, 4, "5123"),
  q("x-overton-coding", "edfarm", "Overton Hour of Code", "Run a one-hour intro to coding for a mixed-age group.", "tech", "tech,teaching", 33.4799, -86.6613, "Overton (demo site)", 2, 75, 4, "5124"),
  // South: Glen Iris / Jones Valley / Powderly / Oxmoor / Hillman
  q("x-gleniris-cafe", "firehouse", "Glen Iris Breakfast Crew", "Cook and serve breakfast with a small team. Aprons provided.", "food", "food,community", 33.4754, -86.8278, "Glen Iris (demo site)", 2, 90, 5, "5125"),
  q("x-powderly-farm", "farm", "Powderly Urban Farm Workday", "Weeding, watering and a little bit of wheelbarrow driving.", "farm", "gardening,outdoors", 33.4626, -86.8648, "Powderly (demo site)", 2, 120, 8, "5126"),
  q("x-jonesvalley-mentor", "promise", "Jones Valley College Prep Chat", "Share your own college or trade-school story with juniors and seniors.", "education", "teaching,community", 33.4667, -86.8825, "Jones Valley (demo site)", 1, 60, 5, "5127"),
  q("x-oxmoor-trees", "farm", "Oxmoor Tree Planting", "Plant native saplings along a greenway.", "community", "outdoors,gardening", 33.4285, -86.8655, "Oxmoor (demo site)", 2, 120, 12, "5128"),
  q("x-hillman-lab", "edfarm", "Hillman Park Computer Lab", "Staff a weekend lab; help with forms and printing.", "tech", "tech,community,seniors", 33.4435, -86.9028, "Hillman Park (demo site)", 1, 90, 4, "5129"),
  q("x-dolomite-pantry", "firehouse", "Dolomite Pantry Sorting", "Sort donated canned goods by date and category.", "food", "food,community", 33.4740, -86.9568, "Dolomite (demo site)", 1, 60, 6, "5130"),
  // Central-ish neighborhoods outside the downtown core
  q("x-titusville-garden", "farm", "Titusville Garden Mulch Day", "Spread mulch and plant herbs in a neighborhood garden.", "farm", "gardening,outdoors", 33.4994, -86.8249, "Titusville (demo site)", 1, 90, 8, "5131"),
  q("x-graymont-homework", "promise", "Graymont Study Hall", "Quiet homework help for teens, plus snacks.", "education", "teaching", 33.5093, -86.8427, "Graymont (demo site)", 1, 60, 4, "5132"),
  q("x-avondale-brewhall", "firehouse", "Avondale Supper Prep", "Chop, stir and plate for a community supper.", "food", "food,community", 33.5262, -86.7616, "East Avondale (demo site)", 1, 75, 6, "5133"),
  q("x-forestpark-music", "promise", "Forest Park Music Table", "Help run a drop-in music and instrument petting-zoo for kids.", "community", "music,teaching", 33.5153, -86.7682, "Forest Park (demo site)", 1, 60, 6, "5134"),
  q("x-redmont-seniors", "edfarm", "Redmont Park Senior Tech Cafe", "Pair with an older neighbor over coffee for tech questions.", "seniors", "seniors,tech,teaching", 33.5008, -86.7760, "Redmont Park (demo site)", 1, 60, 4, "5135"),
  q("x-acipco-meals", "firehouse", "Acipco-Finley Meal Delivery", "Ride along to deliver hot meals to homebound neighbors.", "seniors", "seniors,food", 33.5450, -86.8344, "Acipco-Finley (demo site)", 2, 90, 4, "5136"),
];
