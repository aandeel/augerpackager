/* 
    Author: Lucian T. 
    August 2021
    https://www.yeggs.org/
*/


const maxScreenshotCount = 5
const templatesLoc = 'https://raw.githubusercontent.com/Chopper2112/augerpackager/main/templates/'
const validFileColor = 'skyblue'
const invalidFileColor = 'rgb(255, 133, 133)'



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
            invalidUpload(panorama, 'Panorama must be a .jpg file type.')
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

// Key art, partner art, pack icon, and world icon upload processing
function processAssetUpload(element, assetName, assetWidth, assetHeight, assetFileType) {
    asset = assetName.replace(" ","").toLowerCase()

    // Get image element and reset it
    try {document.getElementById(asset+"ImageDisplay").remove()} catch {}
    var image = document.getElementById(asset+"Image");
    var imageDisplay = image.cloneNode(true)
    imageDisplay.id = asset+"ImageDisplay"
    imageDisplay.style.display = "none"

    if(element.value) {

        // Check if file is jpg type
        if(!element.files[0].name.includes("."+assetFileType)) {
            invalidUpload(element, assetName+" must be a ."+assetFileType+" file type.")
        }
        else {
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
    }
    // Set upload button text color to red if file is removed
    else {
        element.style.color = invalidFileColor
    }
}

// Handle keyart when uploaded
keyart.onchange = async () => {
    processAssetUpload(keyart, "Key Art", 1920, 1080, "jpg")
}

// Handle partnerart when uploaded
partnerart.onchange = async () => {
    processAssetUpload(partnerart, "Partner Art", 1920, 1080, "png")
}

// Handle worldicon when uploaded
worldicon.onchange = async () => {
    processAssetUpload(worldicon, "World Icon", 800, 450, "jpg")
}

// Handle packicon when uploaded
packicon.onchange = async () => {
    processAssetUpload(packicon, "Pack Icon", 256, 256, "jpg")
}

// Handle HD screenshots when uploaded
screenshotsHD.onchange = async () => {

    // Delete each screenshot
    screenshotImages = document.getElementById("screenshotImagesHD").children
    for (let i = screenshotImages.length-1; i > 0; i--) {
        screenshotImages[i].remove();
    }

    if(screenshotsHD.value) {

        // Set upload button text color to blue
        screenshotsHD.style.color = validFileColor


        var breakLoop;
        for (let i = 0; i < screenshotsHD.files.length; i++) {
            
            const screenshot = screenshotsHD.files[i]

            // Check file type
            if(!screenshot.name.includes(".jpg")) {
                invalidUpload(screenshotsHD, screenshot.name+" is an invalid file type. HD Screenshots should be .jpg")
                breakLoop = true;
            }

            // Create image using screenshot texture to check size and format //
            /* Make image element with screenshot */
            const image = new Image()

            /* Make canvas element */
            image.onload = () => {
                setTimeout(() => {

                    // Check dimensions of screenshot
                    if(image.width != 1920 || image.height != 1080) {
                        invalidUpload(screenshotsHD, screenshotsHD.files[i].name+" must be 1920x1080 pixels in size, but is "+image.width+"x"+image.height+".")
                        
                        breakLoop = true; // break statement not working, so boolean flag to break loop

                        // Delete all HD screenshots & end loop if invalid image detected
                        for (let i = screenshotImages.length-1; i > 0; i--) {
                            screenshotImages[i].remove();
                        }
                    }
                    else if(!breakLoop) {

                        // Display image
                        var screenshotImage = document.getElementById("screenshotImageHD");
                        var newScreenshotImage = screenshotImage.cloneNode(true)
                        newScreenshotImage.id = "screenshotHD"+i
                        document.getElementById("screenshotImagesHD").appendChild(newScreenshotImage);
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
        screenshotsHD.style.color = invalidFileColor
    }
}

// Handle screenshots when uploaded
screenshots.onchange = async () => {

    // Delete each screenshot
    screenshotImages = document.getElementById("screenshotImages").children
    for (let i = screenshotImages.length-1; i > 0; i--) {
        screenshotImages[i].remove();
    }

    if(screenshots.value) {
        if(screenshots.files.length == maxScreenshotCount) { // Check for exactly 5 screenshots

            // Set upload button text color to blue
            screenshots.style.color = validFileColor


            var breakLoop;
            for (let i = 0; i < maxScreenshotCount; i++) {
                
                const screenshot = screenshots.files[i]
            
                // Check file type
                if(!screenshot.name.includes(".jpg")) {
                    invalidUpload(screenshots, screenshot.name+" is an invalid file type. Screenshots should be .jpg")
                    breakLoop = true;
                }

                // Create image using screenshot texture to check size and format //
                /* Make image element with screenshot */
                const image = new Image()

                /* Make canvas element */
                image.onload = () => {
                    setTimeout(() => {

                        // Check dimensions of screenshot
                        if(image.width != 800 || image.height != 450) {
                            invalidUpload(screenshots, screenshots.files[i].name+" must be 800x450 pixels in size, but is "+image.width+"x"+image.height+".")
                            
                            breakLoop = true; // break statement not working, so boolean flag to break loop

                            // Delete all screenshots & end loop if invalid image detected
                            for (let i = screenshotImages.length-1; i > 0; i--) {
                                screenshotImages[i].remove();
                            }
                        }
                        else if(!breakLoop) {

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
        else { // Not exactly 5 screenshots
            invalidUpload(screenshots, "There must be exactly 5 screenshots. You uploaded "+screenshots.files.length+".")
        }
    } 

    else {
        // Set upload button text color to red if file removed
        screenshots.style.color = invalidFileColor
    }
}

// Handle skins when uploaded
skins.onchange = async () => {

    document.getElementById("column2").style.display = "block"

    // Delete each skin entry
    skinsFileList = document.getElementById("fileNames").children
    skinsNameList = document.getElementById("skinNames").children
    skinsTypeList = document.getElementById("skinTypes").children
    for (let i = skinsFileList.length-1; i > 2; i--) {
        skinsFileList[i].remove();
        skinsNameList[i].remove();
        skinsTypeList[i].remove();
    }

    // Add skins to list if file added
    if(skins.value) {

        // Set upload button text color to blue
        skins.style.color = validFileColor

        // Show labels
        skinsFileListLabel.style.display = "inline"
        skinsNameListLabel.style.display = "inline"
        skinsTypeListLabel.style.display = "inline"

        for (let i = 0; i < skins.files.length; i++) {
            const skin = skins.files[i]

            // Check file type
            if(!skin.name.includes(".png")) {
                alert(skin.name+" is an invalid file type. Skins should be .png")
                continue;
            }

            // Create image using skin texture to determine model & definition //
            /* Make image element with skin texture image */
            const skinImg = new Image()  

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
                    newSkinEntryName.value = toTitleCase(skin.name.replaceAll(".png", "").replaceAll("_a", "").replaceAll("_s", "").replaceAll("_", " ").replaceAll("-", " ").replaceAll("-", " ").replaceAll("a_", "").replaceAll("s_", ""));
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
                    newSkinPreview.style.display = "inline";
                    newSkinPreview.style.top = i*22.185+'px'
                    newSkinPreview.src = createSkinPreview(skinImg)
                    document.getElementById("skinPreviews").appendChild(newSkinPreview);

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
            skinImg.src = URL.createObjectURL(skin)
        }
    } 

    // Remove skins if file removed
    else {
        
        // Set upload button text color to red
        skins.style.color = invalidFileColor

        // Hide labels
        document.getElementById("skinsFileListLabel").style.display = "none"
        document.getElementById("skinsNameListLabel").style.display = "none"
        document.getElementById("skinsTypeListLabel").style.display = "none"
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
document.getElementById('acronym').addEventListener('input', function (e) { this.style.width = setWidth(this); });
document.getElementById('offertype').addEventListener('input', function (e) { showOfferSpecificFields(this.value) });

// Show elements based on offer type selected
const showOfferSpecificFields = function (offertype) {

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
    screenshotsHDLabel = document.getElementById("screenshotsHDLabel")
    screenshotsHDInput = document.getElementById("screenshotsHD")
    screenshotsHDImages = document.getElementById("screenshotImagesHD")
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
    screenshotsHDLabel.style.display = 'none'
    screenshotsHDInput.style.display = 'none'
    screenshotsHDImages.style.display = 'none'
    panoramaLabel.style.display = 'none'
    panoramaInput.style.display = 'none'
    panoramaImages.style.display = 'none'
    mcversionInput.style.display = 'none'
    mcversionLabel.style.display = 'none'

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
        screenshotsHDLabel.style.display = 'inline'
        screenshotsHDInput.style.display = 'inline'
        screenshotsHDImages.style.display = 'inline'
        panoramaLabel.style.display = 'inline'
        panoramaInput.style.display = 'inline'
        panoramaImages.style.display = 'inline'
    }

    if (offertype.includes("skins")) {
        skinsColumn.style.display = 'block'
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
    else if(document.getElementById('keyart').style.color != validFileColor) {
        alert('You need to upload a Key Art image!')
    }
    else if(document.getElementById('partnerart').style.color != validFileColor) {
        alert('You need to upload a Partner Art image!')
    }
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
            } catch(e) {alert(e)}
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
            });
        }
    }
}


async function packageSkinpack(zip) {

    // Get skinpack info from input fields
    skinpackName = document.getElementById('name').value
    skinpackID = skinpackName.replace(/[^0-9a-zA-Z]+/g,'')
    version = document.getElementById('version').value.replaceAll('.',', ')
    skinsFileList = document.getElementById("fileNames").children
    skinsNameList = document.getElementById("skinNames").children
    skinsTypeList = document.getElementById("skinTypes").children
    skinFiles = Array.from(document.getElementById('skins').files)
    keyartFile = document.getElementById('keyart').files[0]
    partnerartFile = document.getElementById('partnerart').files[0]

    // Get UUIDs (generate random UUID1 if none is given)
    uuid1 = document.getElementById('manifestuuid').value
    if(!uuid1) { uuid1 = uuid() }
    uuid2 = uuid()

    // Create directories
    zip.folder("Marketing Art")
    zip.folder("Store Art")
    zip.folder("Content")
    zip.folder("Content/skin_pack")
    zip.folder("Content/skin_pack/texts")


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
            skinName = skinsNameList[i].value
            skinID = skinName.replace(/[^0-9a-zA-Z]+/g,'')
            skinFilename = skinsFileList[i].value
            skinFile = skinFiles.find(element => element.name === skinFilename)

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
                skins += skinEntryTemplate.replace("$skinFile", skinFilename).replace("$skinGeometry", skinGeometry).replace("$skin", skinID)
                skinsLang += 'skin.'+skinpackID+'.'+skinID+'='+skinName
                if(i + 1 < skinsFileList.length) { skins += ',\n'; skinsLang += '\n' }


                // Create skin texture files
                zip.file('Content/skin_pack/'+skinFilename, skinFile, {binary: true})
            }
        }
        
        // Add all skin entries to skins.json & en_US.json
        skinsFileContents = skinsFileContents.replace("$skins", skins)
        enUSFileContents = enUSFileContents.replace("$skinsLang", skinsLang)
    

    // Create 800x450 key art image for thumbnail
    thumbnailFile = await(createThumbnail(keyartFile))

    // Create marketing/store art files
    zip.file('Marketing Art/'+skinpackID+'_MarketingKeyArt.jpg', keyartFile, {binary: true})
    zip.file('Marketing Art/'+skinpackID+'_PartnerArt.png', partnerartFile, {binary: true})
    zip.file('Store Art/'+skinpackID+'_Thumbnail_0.jpg', thumbnailFile, {binary: true})

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


// Create thumbnail by resizing keyart (input keyartFile, return file)
const createThumbnail = (keyartFile) => new Promise((resolve) => {
    const keyartImg = new Image()  

    keyartImg.onload = () => {
        setTimeout(() => {

            // Create canvas
            var canvas = document.createElement('canvas');
            canvas.width = 800
            canvas.height = 450
            canvas.getContext('2d').drawImage(keyartImg, 0, 0, 800, 450)

            // Return canvas converted to file
            canvas.toBlob(blob => resolve(blob), 'image/jpeg')
            
        }, 100)
    }
    keyartImg.src = URL.createObjectURL(keyartFile)
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
    context.drawImage(skinImg, 8, 8, 8, 8, 0, 0, skinImg.width, skinImg.height)
    return canvas.toDataURL()
}