/* 
    Author: Lucian Tash
    August 2022
    https://www.yeggs.org/
*/

const maxScreenshotCount = 5
const templatesLoc = 'https://raw.githubusercontent.com/Chopper2112/augerpackager/main/templates/'
const validFileColor = 'skyblue'
const invalidFileColor = 'rgb(255, 133, 133)'




// Key art, partner art, pack icon, and world icon upload processing
async function processAssetUpload(element, assetName, assetWidth, assetHeight, assetFileType) {
    asset = assetName.replace(" ","").toLowerCase()

    // Get image element and reset it
    try {document.getElementById(asset+"ImageDisplay").remove()} catch {}
    var image = document.getElementById(asset+"Image");
    var imageDisplay = image.cloneNode(true)
    imageDisplay.id = asset+"ImageDisplay"
    imageDisplay.style.display = "none"

    if(element.value) {

        // Check if file is correct type and convert if not
        if(!element.files[0].name.includes("."+assetFileType)) {
            element.files[0] = await(convertImage(element.files[0], assetWidth, assetHeight, assetFileType))
            alert('Automatically converted '+assetName+' to .'+assetFileType+' file type.')
            // invalidUpload(element, assetName+" must be a ."+assetFileType+" file type.")
        }

        // Create image
        element.style.color = validFileColor
        image.src = URL.createObjectURL(element.files[0]);
        imageDisplay.src = URL.createObjectURL(element.files[0]);

        // Check if file is correct size
        image.onload = () => {
            if(image.width != assetWidth || image.height != assetHeight) {
                invalidUpload(element, assetName+" must be "+assetWidth+"x"+assetHeight+" pixels in size.")
            }
            else { 
                // Display cloned image
                imageDisplay.onload = () => {
                    imageDisplay.height = 144
                    imageDisplay.style.display = "block"
                    document.getElementById(asset+"Images").appendChild(imageDisplay)
                }
            }
        }
    }
    // Set upload button text color to red if file is removed
    else {
        element.style.color = invalidFileColor
    }
}

// Handle keyart when uploaded
keyart.onchange = async () => {
    await processAssetUpload(keyart, "Key Art", 1920, 1080, "jpg")
}

// Handle panorama when uploaded
panorama.onchange = async () => {

    // Get image element and reset it
    try {document.getElementById("panoramaImageDisplay").remove()} catch {}
    var image = document.getElementById('panoramaImage');
    var imageDisplay = image.cloneNode(true)
    imageDisplay.id = "panoramaImageDisplay"
    imageDisplay.style.display = "none"

    if(panorama.value) {

        // Check if file is jpg type
        if(!panorama.files[0].name.includes(".jpg")) {
            invalidUpload(panorama, 'Panorama must be a .jpg file type. Panorama cannot be automatically converted.')
        }
        else {
            // Create image
            panorama.style.color = validFileColor
            image.src = URL.createObjectURL(panorama.files[0]);
            imageDisplay.src = URL.createObjectURL(panorama.files[0]);

            // Check if file is correct size
            image.onload = () => {
                if(image.width < 1000 || image.width > 4000 || image.height != 450) {
                    invalidUpload(panorama, "Panorama must be 450 pixels in height and between 1000-4000 pixels in width.")
                }
                else { 
                    // Display cloned image
                    imageDisplay.onload = () => {
                        imageDisplay.height = 144
                        imageDisplay.style.display = "block"
                        document.getElementById("panoramaImages").appendChild(imageDisplay)
                    }
                }
            }
        }
    }
    // Set upload button text color to red if file is removed
    else {
        panorama.style.color = invalidFileColor
    }
}

// Handle partnerart when uploaded
partnerart.onchange = async () => {
    await processAssetUpload(partnerart, "Partner Art", 1920, 1080, "png")
}

// Handle packicon when uploaded
packicon.onchange = async () => {
    await processAssetUpload(packicon, "Pack Icon", 256, 256, "jpg")
}

// Handle screenshots when uploaded
screenshots.onchange = async () => {

    // Delete each screenshot
    screenshotImages = document.getElementById("screenshotImages").children
    for (let i = screenshotImages.length-1; i > 0; i--) {
        screenshotImages[i].remove();
    }

    if(screenshots.value) {

        // Set upload button text color to blue
        screenshots.style.color = validFileColor

        for (let i = 0; i < screenshots.files.length; i++) {
            var ignoreFile = false;
            const screenshot = screenshots.files[i]

            // Check file type and convert if possible
            if(screenshot.name.includes(".png")) {
                screenshots.files[i] = await(convertImage(screenshot, 1920, 1080, 'jpeg'))
                alert('Automatically converted screenshot '+screenshots.files[i].name+' to .jpg file type.')
            }
            else if(!screenshot.name.includes(".jpg")) {
                alert('Invalid file ' + screenshot.name + ' detected and ignored.')
                ignoreFile = true;
            }

            // Create image using screenshot texture to check size and format //
            /* Make image element with screenshot */
            const image = new Image()

            /* Make canvas element */
            image.onload = () => {
                setTimeout(() => {

                    // Check dimensions of screenshot
                    if(image.width != 1920 || image.height != 1080) {
                        invalidUpload(screenshots, screenshots.files[i].name+" must be 1920x1080 pixels in size, but is "+image.width+"x"+image.height+".")
                        ignoreFile = true;
                    }
                    else if(!ignoreFile) {
                        // Display image
                        var screenshotImage = document.getElementById("screenshotImage");
                        var newScreenshotImage = screenshotImage.cloneNode(true)
                        newScreenshotImage.id = "screenshot"+i
                        document.getElementById("screenshotImages").appendChild(newScreenshotImage);
                        newScreenshotImage.style.display = "inline"
                        newScreenshotImage.src = URL.createObjectURL(screenshot)
                    }
                
                
                }, 200)
            }
            image.src = URL.createObjectURL(screenshot)
        }
    } 
    else {
        // Set upload button text color to red if file removed
        screenshots.style.color = invalidFileColor
    }
}

world.onchange = async () => {
    world.style.color = validFileColor
}

// Handle skins when uploaded
skins.onchange = async () => {

    document.getElementById("column2").style.display = "block"

    // Delete each skin entry
    skinsFileList = document.getElementById("fileNames").children
    skinsNameList = document.getElementById("skinNames").children
    skinsTypeList = document.getElementById("skinTypes").children
    skinsPreviewsList = document.getElementById("skinPreviews").children
    freeCheckboxesList = document.getElementById("freeCheckboxes").children
    for (let i = skinsFileList.length-1; i > 2; i--) { //remove existing skins
        skinsFileList[i].remove();
        skinsNameList[i].remove();
        skinsTypeList[i].remove();
        freeCheckboxesList[i].remove();
        try { skinsPreviewsList[i].remove(); } catch(e) { console.log(e) }
    }

    // Add skins to list if file added
    if(skins.value) {

        // Set upload button text color to blue
        skins.style.color = validFileColor

        // Show labels
        offertype = document.getElementById('offertype').value
        skinsFileListLabel.style.display = "inline"
        skinsNameListLabel.style.display = "inline"
        skinsTypeListLabel.style.display = "inline"
        if (offertype == "skins")
            freeCheckboxesLabel.style.display = "inline"

        for (let i = 0; i < skins.files.length; i++) {
            const skin = skins.files[i]

            // Check file type
            if(!skin.name.includes(".png")) {
                alert(skin.name+" is an invalid file type. Skins should be .png")
                continue
            }

            // Create image using skin texture to determine model & definition //
            /* Make image element with skin texture image */
            const skinImg = new Image()
            skinImg.src = URL.createObjectURL(skin)

            /* Make canvas element */
            skinImg.onload = () => {
                setTimeout(() => {

                    var canvas = document.createElement('canvas');
                    canvas.width = skinImg.width;
                    canvas.height = skinImg.height;
                    canvas.getContext('2d').drawImage(skinImg, 0, 0, skinImg.width, skinImg.height);

                    // Add each skin file name
                    var skinEntryFile = document.getElementById("skinsFileList");
                    var newSkinEntryFile = skinEntryFile.cloneNode(true);
                    newSkinEntryFile.removeAttribute("id");
                    newSkinEntryFile.value = skin.name;
                    newSkinEntryFile.style.display = "block";
                    document.getElementById("fileNames").appendChild(newSkinEntryFile);

                    // Add each skin name
                    var skinEntryName = document.getElementById("skinsNameList");
                    var newSkinEntryName = skinEntryName.cloneNode(true);
                    newSkinEntryName.removeAttribute("id");
                    newSkinEntryName.value = toTitleCase(skin.name.replaceAll(".png", "").replaceAll("_a", "").replaceAll("a_", "").replaceAll("s_", "").replaceAll("_s", "").replaceAll("_", " ").replaceAll("-", " ").replaceAll("-", " "));
                    newSkinEntryName.style.display = "block";
                    document.getElementById("skinNames").appendChild(newSkinEntryName);

                    // Add each skin type
                    var skinEntryType = document.getElementById("skinsTypeList");
                    var newSkinEntryType = skinEntryType.cloneNode(true);
                    newSkinEntryType.removeAttribute("id");
                    newSkinEntryType.style.display = "block";
                    document.getElementById("skinTypes").appendChild(newSkinEntryType);

                    // Add skin preview
                    var skinPreview = document.getElementById("skinPreview");
                    var newSkinPreview = skinPreview.cloneNode(true);
                    newSkinPreview.removeAttribute("id");
                    newSkinPreview.src = createSkinPreview(skinImg)
                    document.getElementById("skinPreviews").appendChild(newSkinPreview);

                    // Add free checkbox
                    if (offertype == "skins") {
                        freeCheckboxesLabel.style.display = "inline"
                        var skinPreview = document.getElementById("freeCheckbox");
                        var newCheckbox = freeCheckbox.cloneNode(true);
                        newCheckbox.removeAttribute("id");
                        newCheckbox.style.display = "inline";
                        newCheckbox.style.top = i*22.185+'px'
                        newCheckbox.value = i
                        document.getElementById("freeCheckboxes").appendChild(newCheckbox);
                    }

                    // Fill out Details info
                    if(skinImg.width == 64) {
                        if(canvas.getContext('2d').getImageData(54, 25, 1, 1).data[3] == 0) {
                            newSkinEntryType.value = "64x Slim"
                        }
                        else {
                            newSkinEntryType.value = "64x Classic"
                        }
                    }
                    else if(skinImg.width == 128) {
                        if(canvas.getContext('2d').getImageData(108, 50, 1, 1).data[3] == 0) {
                            newSkinEntryType.value = "128x Slim"
                        }
                        else {
                            newSkinEntryType.value = "128x Classic"
                        }
                    }
                    else {
                        newSkinEntryType.value = "INVALID"
                        newSkinEntryType.style.color = 'rgb(128, 0, 0)'
                        newSkinEntryType.style.fontWeight = 'bold'
                    }
                }, 100)
            }
        }
        setTimeout(() => {
            for(let i = 1; i < skinsPreviewsList.length; i++) {
                skinsPreviewsList[i].style.top = (i-1)*22.185+'px'
                skinsPreviewsList[i].style.display = "inline";
            }
        },1000)
    } 

    // Remove skins if file removed
    else {
        
        // Set upload button text color to red
        skins.style.color = invalidFileColor

        // Hide labels
        document.getElementById("freeCheckboxesLabel").style.display = "none"
        document.getElementById("skinsFileListLabel").style.display = "none"
        document.getElementById("skinsNameListLabel").style.display = "none"
        document.getElementById("skinsTypeListLabel").style.display = "none"
        document.getElementById("skinsPreviewsList").style.display = "none"
    }
}



// Auto expand text box inputs
const setWidth = function (elem) {

    value = elem.value
    placeholder = elem.getAttribute('placeholder')

    // Create a div element
    const fakeEle = document.createElement('div');

    // Hide it completely
    fakeEle.style.position = 'absolute';
    fakeEle.style.top = '0';
    fakeEle.style.left = '-9999px';
    fakeEle.style.overflow = 'hidden';
    fakeEle.style.visibility = 'hidden';
    fakeEle.style.whiteSpace = 'nowrap';
    fakeEle.style.height = '0';

    // Get the styles
    const styles = window.getComputedStyle(elem);

    // Copy font styles from the textbox
    fakeEle.style.fontFamily = styles.fontFamily;
    fakeEle.style.fontSize = styles.fontSize;
    fakeEle.style.fontStyle = styles.fontStyle;
    fakeEle.style.fontWeight = styles.fontWeight;
    fakeEle.style.letterSpacing = styles.letterSpacing;
    fakeEle.style.textTransform = styles.textTransform;

    fakeEle.style.borderLeftWidth = styles.borderLeftWidth;
    fakeEle.style.borderRightWidth = styles.borderRightWidth;
    fakeEle.style.paddingLeft = styles.paddingLeft;
    fakeEle.style.paddingRight = styles.paddingRight;

    // Append the fake element to `body`
    document.body.appendChild(fakeEle);

    const string = value ||
        placeholder || '';
    fakeEle.innerHTML = string.replace(/\s/g, '&' + 'nbsp;');

    const fakeEleStyles = window.getComputedStyle(fakeEle);
    return fakeEleStyles.width;
};

// Methods for when input fields are interacted with
document.getElementById('name').addEventListener('input', function (e) { this.style.width = setWidth(this); });
document.getElementById('version').addEventListener('input', function (e) { this.style.width = setWidth(this); });
document.getElementById('mcversion').addEventListener('input', function (e) { this.style.width = setWidth(this); });
document.getElementById('manifestuuid').addEventListener('input', function (e) { this.style.width = setWidth(this); });
document.getElementById('acronym').addEventListener('input', function (e) { this.value=this.value.toUpperCase(); this.style.width = setWidth(this); });
document.getElementById('offertype').addEventListener('input', function (e) { showOfferSpecificFields(this.value) });

// Show elements based on offer type selected
const showOfferSpecificFields = function (offertype) {

    nameInput = document.getElementById('name')
    mcversionInput = document.getElementById('mcversion')
    mcversionLabel = document.getElementById('mcversionLabel')
    acronymInput = document.getElementById('acronym')
    acronymLabel = document.getElementById('acronymLabel')
    fileInput = document.getElementById('world')
    fileLabel = document.getElementById('worldLabel')
    resourcePackInput = document.getElementById('resourcePack')
    resourcePackLabel = document.getElementById('resourcePackLabel')
    behaviorPackInput = document.getElementById('behaviorPack')
    behaviorPackLabel = document.getElementById('behaviorPackLabel')
    skinsColumn = document.getElementById("column2")
    worldAssetsColumn = document.getElementById("column4")
    screenshotLabel = document.getElementById("screenshotLabel")
    screenshotInput = document.getElementById("screenshots")
    screenshotImages = document.getElementById("screenshotImages")
    panoramaLabel = document.getElementById("panoramaLabel")
    panoramaInput = document.getElementById("panorama")
    panoramaImages = document.getElementById("panoramaImages")

    fileInput.style.display = 'none'
    fileLabel.style.display = 'none'
    acronymInput.style.display = 'none'
    acronymLabel.style.display = 'none'
    resourcePackInput.style.display = 'none'
    resourcePackLabel.style.display = 'none'
    behaviorPackInput.style.display = 'none'
    behaviorPackLabel.style.display = 'none'
    skinsColumn.style.display = 'none'
    worldAssetsColumn.style.display = 'none'
    screenshotLabel.style.display = 'none'
    screenshotInput.style.display = 'none'
    screenshotImages.style.display = 'none'
    panoramaLabel.style.display = 'none'
    panoramaInput.style.display = 'none'
    panoramaImages.style.display = 'none'
    mcversionInput.style.display = 'none'
    mcversionLabel.style.display = 'none'

    if (offertype.includes("skins")) {
        skinsColumn.style.display = 'block'
        nameInput.placeholder = 'Anime Sus Teens'
        nameInput.style.width = setWidth(nameInput)
    }

    if (offertype.includes("world")) {
        mcversionInput.style.display = 'inline'
        mcversionLabel.style.display = 'inline'
        acronymInput.style.display = 'inline'
        acronymLabel.style.display = 'inline'
        fileInput.style.display = 'inline'
        fileLabel.style.display = 'inline'
        resourcePackInput.style.display = 'inline'
        resourcePackLabel.style.display = 'inline'
        behaviorPackInput.style.display = 'inline'
        behaviorPackLabel.style.display = 'inline'
        worldAssetsColumn.style.display = 'block'
        screenshotLabel.style.display = 'inline'
        screenshotInput.style.display = 'inline'
        screenshotImages.style.display = 'inline'
        panoramaLabel.style.display = 'inline'
        panoramaInput.style.display = 'inline'
        panoramaImages.style.display = 'inline'

        nameInput.placeholder = 'Capybara Moai Island'
        nameInput.style.width = setWidth(nameInput)
    }
}

// Show Manifest UUID field if version is not 1.0.0
version.onchange = async () => {
    if(version.value != '1.0.0') {
        document.getElementById('manifestuuid').style.display = 'inline'
        document.getElementById('manifestuuidLabel').style.display = 'inline'
    }
    else {
        document.getElementById('manifestuuid').style.display = 'none'
        document.getElementById('manifestuuidLabel').style.display = 'none'
    }
}

// Invalid file submitted
function invalidUpload(elem, warning) {
    elem.style.color = invalidFileColor
    console.log("ERROR: "+warning)
    alert(warning)
}

// Convert string to title case
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
        }
    );
}

// Generate new UUIDv4  https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid/2117523#2117523
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// PACKAGE Button pressed
packageButton = document.getElementById('package')
packageButton.onclick = async function () {
    
    offertype = document.getElementById('offertype').value

    // Check if packaging is legal
    if(!document.getElementById('name').value) {
        alert('You need to enter an Offer Name!')
    }
    else if(!document.getElementById('version').value) {
        alert('You need to enter a Version!')
    }
    else if(offertype.includes("skins") && !document.getElementById('skins').value) {
        alert('You need to upload a folder of Skins!')
    }
    else if(offertype.includes("world") && !document.getElementById('mcversion').value) {
        alert('You need to enter a Minecraft Version!')
    }
    else if(offertype.includes("world") && !document.getElementById('acronym').value) {
        alert('You need to enter an acronym!')
    }
    else if(offertype.includes("world") && !document.getElementById('world').value) {
        alert('You need to upload the world folder!')
    }
    else if(offertype.includes("world") && !document.getElementById('packicon').value && (document.getElementById('resourcePack').value || document.getElementById('behaviorPack').value)) {
        alert('You need to upload the pack icon!')
    }
    else if(offertype.includes("world") && !document.getElementById('screenshots').value) {
        alert('You need to upload the screenshots!')
    }
    else if(offertype.includes("world") && !document.getElementById('panorama').value) {
        alert('You need to upload the panorama]!')
    }
    else if(document.getElementById('keyart').style.color != validFileColor) {
        alert('You need to upload a Key Art image!')
    }
    // else if(document.getElementById('partnerart').style.color != validFileColor) {
    //     alert('You need to upload a Partner Art image!')
    // }
    else if(document.getElementById('version').value != '1.0.0' && !document.getElementById('manifestuuid').value) {
        alert('You need to enter the Manifest UUID from a previous version of this offer!\n\nIf this is the first version, enter "1.0.0" as the Version.')
    }

    // Package
    else {
        packageButton.value = 'Working...'
        packageButton.disabled = true
        var download = false
        var zip = new JSZip();

        // Skinpack
        if(offertype == "skins") {
            try { 
                await packageSkinpack(zip)
                download = true
            } catch(e) {
                console.log(e)
                alert('An error occured. Check the console.')
            }
        }
        else if(offertype.includes("world")) {
            try {
                await packageWorld(zip)
                if(offertype.includes("skins"))
                    await packageSkinpack(zip, true)
                download = true
            } catch(e) {
                console.log(e)
                alert('An error occured. Check the console.')
            }
        }
        else {
            alert('Packaging this type of Offer is not yet supported.')
        }
        

        // Download & finish    https://stackoverflow.com/questions/56652367/name-zip-file-created-by-jszip
        if(download) {
            zip.generateAsync({
                type: "base64"
            }).then(function(content) {

                // Download file
                var link = document.createElement('a');
                link.href = "data:application/zip;base64," + content;
                link.download = document.getElementById('name').value+" "+document.getElementById('version').value+".zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Finish packaging
                packageButton.value = 'PACKAGE'
                packageButton.disabled = false
                console.log('Downloaded.')
            });
        }
    }
}


async function packageSkinpack(zip, isWorldOffer) {

    // Get skinpack info from input fields
    skinpackName = document.getElementById('name').value.trim()
    skinpackID = skinpackName.replace(/[^0-9a-zA-Z]+/g,'')
    version = document.getElementById('version').value.replaceAll('.',', ').trim()
    skinsFileList = document.getElementById("fileNames").children
    skinsNameList = document.getElementById("skinNames").children
    skinsTypeList = document.getElementById("skinTypes").children
    freeCheckboxesList = document.getElementById("freeCheckboxes").children
    skinFiles = Array.from(document.getElementById('skins').files)
    keyartFile = document.getElementById('keyart').files[0]
    partnerartFile = document.getElementById('partnerart').files[0]

    // Get UUIDs (generate random UUID1 if none is given)
    uuid1 = document.getElementById('manifestuuid').value
    if(!uuid1) { uuid1 = uuid() }
    uuid2 = uuid()

    // Create directories
    zip.folder("Content/skin_pack/texts")
    if(!isWorldOffer) {
        zip.folder("Marketing Art")
        zip.folder("Store Art")
    }

    // Create en_US.lang contents
    enUSFileContents = await(await fetch(templatesLoc+'skinpacks/en_US.txt')).text()
    enUSFileContents = enUSFileContents.replace("$skinpackName", skinpackName)
    enUSFileContents = enUSFileContents.replaceAll("$skinpack", skinpackID)

    // Create languages.json contents
    languagesFileContents = await(await fetch(templatesLoc+'languages.txt')).text()

    // Create manifest.json contents
    manifestFileContents = await(await fetch(templatesLoc+'skinpacks/manifest.txt')).text()
    manifestFileContents = manifestFileContents.replace("$uuid1", uuid1)
    manifestFileContents = manifestFileContents.replace("$uuid2", uuid2)
    manifestFileContents = manifestFileContents.replaceAll("$version", version)

    // Create skins.json contents
    skinsFileContents = await(await fetch(templatesLoc+'skinpacks/skins.txt')).text()
    skinsFileContents = skinsFileContents.replaceAll("$skinpack", skinpackID)
    skinEntryTemplate = await(await fetch(templatesLoc+'skinpacks/skin_entry.txt')).text()

    // Iterate through all skins
    skins = ''
    skinsLang = ''
    for(let i = 3; i < skinsFileList.length; i++) {
        
        // Get skin info from input fields
        skinGeometry = skinsTypeList[i].value
        skinName = skinsNameList[i].value.trim()
        skinID = skinName.replace(/[^0-9a-zA-Z]+/g,'')
        skinFilename = skinsFileList[i].value.trim()
        skinFile = skinFiles.find(element => element.name === skinFilename)

        // Get pay type by iterating through each checkbox by ID (.value) because the order is jumbled for some reason
        payType = 'paid'
        for(let c = 3; c < freeCheckboxesList.length; c++) {
            if(freeCheckboxesList[c].value == i-3) {
                if(freeCheckboxesList[c].checked) {
                    payType = 'free'
                }
                break
            }
        }

        // Set new file name & geometry
        if(skinGeometry.includes('Slim')) {
            skinFilename = skinID+'_a.png'
            skinGeometry = 'customSlim'
        } 
        else if(skinGeometry.includes('Classic')) { 
            skinFilename = skinID+'_s.png'
            skinGeometry = 'custom'
        }

        // Don't package if invalid
        if(!skinGeometry.includes('INVALID')) {

            // Create entries for skins.json & en_US.json
            skins += skinEntryTemplate.replace("$skinFile", skinFilename).replace("$skinGeometry", skinGeometry).replace("$skin", skinID).replace("$payType", payType)
            skinsLang += 'skin.'+skinpackID+'.'+skinID+'='+skinName
            if(i + 1 < skinsFileList.length) { skins += ',\n'; skinsLang += '\n' }


            // Create skin texture files
            zip.file('Content/skin_pack/'+skinFilename, skinFile, {binary: true})
        }
    }
    
    // Add all skin entries to skins.json & en_US.json
    skinsFileContents = skinsFileContents.replace("$skins", skins)
    enUSFileContents = enUSFileContents.replace("$skinsLang", skinsLang)


    if(!isWorldOffer) {

        // Create 800x450 key art image for thumbnail
        thumbnailFile = await(convertImage(keyartFile, 800, 450, 'jpeg'))
        
        // Create marketing/store art files
        zip.file('Marketing Art/'+skinpackID+'_MarketingKeyArt.jpg', keyartFile, {binary: true})
        zip.file('Store Art/'+skinpackID+'_Thumbnail_0.jpg', thumbnailFile, {binary: true})
        if (partnerartFile) { zip.file('Marketing Art/'+skinpackID+'_PartnerArt.png', partnerartFile, {binary: true}) }
    }

    // Debug print files
    console.log('\n\nskins.json:\n'+skinsFileContents)
    console.log('\n\nmanifest.json:\n'+manifestFileContents)
    console.log('\n\nen_US.lang:\n'+enUSFileContents)
    console.log('\n\nlanguages.json:\n'+languagesFileContents)

    // Create files
    zip.file("Content/skin_pack/skins.json", skinsFileContents)
    zip.file("Content/skin_pack/manifest.json", manifestFileContents)
    zip.file("Content/skin_pack/texts/en_US.lang", enUSFileContents)
    zip.file("Content/skin_pack/texts/languages.json", languagesFileContents)
}

async function packageWorld(zip) {

    // Get world info from input fields
    worldName = document.getElementById('name').value.trim()
    acronym = document.getElementById('acronym').value.trim()
    worldID = worldName.replace(/[^0-9a-zA-Z]+/g,'')
    version = document.getElementById('version').value.replaceAll('.',', ').trim()
    mcversion = document.getElementById('mcversion').value.replaceAll('.',', ')
    panoramaFile = document.getElementById('panorama').files[0]
    screenshotFiles = document.getElementById('screenshots').files
    keyartFile = document.getElementById('keyart').files[0]
    partnerartFile = document.getElementById('partnerart').files[0]
    packiconFile = document.getElementById('packicon').files[0]
    worldFile = document.getElementById('world').files[0]
    bpFile = document.getElementById('behaviorPack').files[0]
    rpFile = document.getElementById('resourcePack').files[0]
    packiconFilePNG = await(convertImage(packiconFile, 256, 256, 'png'))

    // Get UUIDs (generate random UUID1 if none is given)
    uuid1 = document.getElementById('manifestuuid').value
    if(!uuid1) { uuid1 = uuid() }
    uuid2 = uuid()

    // Unzip world file and create Content folder
    // https://stackoverflow.com/questions/39322964/extracting-zipped-files-using-jszip-in-javascript
    await zip.folder("Content/world_template").loadAsync(worldFile).then(function (zipfile) {
        Object.keys(zipfile.files).forEach(function (filename) { 
            zipfile.files[filename].async('string') 
        })
    })

    // Clean world file
    worldpath = 'Content/world_template/'
    zip.remove(worldpath+'manifest.json')
    zip.remove(worldpath+'level.dat_old')
    zip.remove(worldpath+'world_behavior_pack_history.json')
    zip.remove(worldpath+'world_resource_pack_history.json')
    zip.remove(worldpath+'world_behavior_packs.json')
    zip.remove(worldpath+'world_resource_packs.json')
    zip.remove(worldpath+'world_icon.jpeg')
    zip.remove(worldpath+'levelname.txt')
    zip.remove(worldpath+'resource_packs')
    zip.remove(worldpath+'behavior_packs')

    // Create resourcepack
    if(rpFile) {
        await zip.folder(worldpath+'resource_packs/RP_'+acronym).loadAsync(rpFile).then(function (zipfile) {
            Object.keys(zipfile.files).forEach(function (filename) { 
                zipfile.files[filename].async('string') 
            })
        })

        // Make RP UUID
        rpUUID = uuid()
        otherUUID = uuid()

        // Create world_resource_packs.json
        worldRPContents = await(await fetch(templatesLoc+'worlds/world_packs.txt')).text()
        worldRPContents = worldRPContents.replace("$uuid", rpUUID)
        zip.file(worldpath+'world_resource_packs.json', worldRPContents)

        // Create resourcepack manifest.json
        // rpManifestFileContents = await(await fetch(templatesLoc+'worlds/rp_manifest.txt')).text()
        // rpManifestFileContents = rpManifestFileContents.replace("$uuid1", rpUUID)
        // rpManifestFileContents = rpManifestFileContents.replace("$uuid2", otherUUID)
        // rpManifestFileContents = rpManifestFileContents.replaceAll("$version", version)
        // rpManifestFileContents = rpManifestFileContents.replaceAll("$mcversion", mcversion)
        // zip.file(worldpath+'resource_packs/RP_'+acronym+'/manifest.json', rpManifestFileContents)
        // console.log('\n\nworld_resource_packs.json:\n'+rpManifestFileContents)

        // Create pack icon
        zip.file(worldpath+'resource_packs/RP_'+acronym+'/pack_icon.png', packiconFilePNG, {binary: true})
    }

    // Create behaviorpack
    if(bpFile) {
        await zip.folder(worldpath+'behavior_packs/BP_'+acronym).loadAsync(bpFile).then(function (zipfile) {
            Object.keys(zipfile.files).forEach(function (filename) { 
                zipfile.files[filename].async('string') 
            })
        })

        // Make BP UUID
        bpUUID = uuid()
        otherUUID = uuid()

        // Create world_behavior_packs.json
        worldBPContents = await(await fetch(templatesLoc+'worlds/world_packs.txt')).text()
        worldBPContents = worldBPContents.replace("$uuid", bpUUID)
        zip.file(worldpath+'world_behavior_packs.json', worldBPContents)

        // Create behaviorpack manifest.json
        // bpManifestFileContents = await(await fetch(templatesLoc+'worlds/bp_manifest.txt')).text()
        // bpManifestFileContents = bpManifestFileContents.replace("$uuid1", bpUUID)
        // bpManifestFileContents = bpManifestFileContents.replace("$uuid2", otherUUID)
        // bpManifestFileContents = bpManifestFileContents.replaceAll("$version", version)
        // bpManifestFileContents = bpManifestFileContents.replaceAll("$mcversion", mcversion)
        // zip.file(worldpath+'behavior_packs/BP_'+acronym+'/manifest.json', bpManifestFileContents)
        // console.log('\n\nworld_behavior_packs.json:\n'+bpManifestFileContents)

        // Create pack icon
        zip.file(worldpath+'behavior_packs/BP_'+acronym+'/pack_icon.png', packiconFilePNG, {binary: true})
    }

    // Create other directories
    zip.folder("Marketing Art")
    zip.folder("Store Art")
    zip.folder("Content/world_template/texts")

    // Create en_US.lang contents
    enUSFileContents = await(await fetch(templatesLoc+'worlds/en_US.txt')).text()
    enUSFileContents = enUSFileContents.replace("$worldName", worldName)

    // Create languages.json contents
    languagesFileContents = await(await fetch(templatesLoc+'languages.txt')).text()

    // Create manifest.json contents
    manifestFileContents = await(await fetch(templatesLoc+'worlds/manifest.txt')).text()
    manifestFileContents = manifestFileContents.replace("$uuid1", uuid1)
    manifestFileContents = manifestFileContents.replace("$uuid2", uuid2)
    manifestFileContents = manifestFileContents.replaceAll("$version", version)
    manifestFileContents = manifestFileContents.replaceAll("$mcversion", mcversion)

    // Create 800x450 key art image for thumbnail and world icon
    thumbnailFile = await(convertImage(keyartFile, 800, 450, 'jpeg'))

    // Create marketing/store art files and world icon
    zip.file('Marketing Art/'+worldID+'_MarketingKeyArt.jpg', keyartFile, {binary: true})
    zip.file('Store Art/'+worldID+'_Thumbnail_0.jpg', thumbnailFile, {binary: true})
    zip.file('Store Art/'+worldID+'_panorama_0.jpg', panoramaFile, {binary: true})
    zip.file('Store Art/'+worldID+'_packicon_0.jpg', packiconFile, {binary: true})
    zip.file(worldpath+'world_icon.jpeg', thumbnailFile, {binary: true})
    if (partnerartFile) { zip.file('Marketing Art/'+worldID+'_PartnerArt.png', partnerartFile, {binary: true}) }

    // Create screenshots
    for(let i = 0; i < screenshotFiles.length; i++) {
        if(!screenshotFiles[i].name.includes(".jpg")) { continue }

        // Create  screenshot (Marketing Art)
        zip.file('Marketing Art/'+worldID+'_MarketingScreenshot_'+i+'.jpg', screenshotFiles[i], {binary: true})

        // Create SD screenshot (Store Art)
        screenshotSDFile = await(convertImage(screenshotFiles[i], 800, 450, 'jpeg'))
        zip.file('Store Art/'+worldID+'_screenshot_'+i+'.jpg', screenshotSDFile, {binary: true})
    }


    // Debug print files
    console.log('\n\nmanifest.json:\n'+manifestFileContents)
    console.log('\n\nen_US.lang:\n'+enUSFileContents)
    console.log('\n\nlanguages.json:\n'+languagesFileContents)

    // Create level name, lang, and manifest files
    zip.file("Content/world_template/levelname.txt", worldName)
    zip.file("Content/world_template/manifest.json", manifestFileContents)
    zip.file("Content/world_template/texts/en_US.lang", enUSFileContents)
    zip.file("Content/world_template/texts/languages.json", languagesFileContents)
}

// Create thumbnail by resizing keyart (input 1920x1080 file, return 800x450 file)
const convertImage = (file, width, height, format) => new Promise((resolve) => {
    const fileImg = new Image()  

    fileImg.onload = () => {
        setTimeout(() => {

            // Create canvas
            var canvas = document.createElement('canvas');
            canvas.width = width
            canvas.height = height
            canvas.getContext('2d').drawImage(fileImg, 0, 0, width, height)

            // Return canvas converted to file
            canvas.toBlob(blob => resolve(blob), 'image/'+format)
            
        }, 100)
    }
    fileImg.src = URL.createObjectURL(file)
})

// Create cropped and resized skin preview (input skinImg, return src)
function createSkinPreview(skinImg) {
    
    // Create canvas
    var canvas = document.createElement('canvas');
    canvas.width = skinImg.width;
    canvas.height = skinImg.height;
    context = canvas.getContext('2d')
    
    // Disable anti-aliasing
    context.webkitImageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;

    // Crop & resize, and return src
    if(canvas.width == 64) {
        context.drawImage(skinImg, 8, 8, 8, 8, 0, 0, skinImg.width, skinImg.height)
    }
    else if(canvas.width == 128) {
        context.drawImage(skinImg, 16, 16, 16, 16, 0, 0, skinImg.width, skinImg.height)
    }
    return canvas.toDataURL()
}

// Debug world packager
// showOfferSpecificFields("world+skins")
// acronymInput.value = 'PTWN'
// mcversionInput.value = '1.19'
// nameInput.value = 'Puppy Town'