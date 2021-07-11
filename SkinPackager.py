import os
import shutil
import imageio
import uuid



# ==================================================================================================================#


# Get pack name
# packName = 'PACKAGER DEBUG'
packName = input('Skin Pack Name: ')
packID = packName.replace(' ','')

# Place to put output
path = 'C:/Users/Chopper/Desktop/_'+packName

# Input skins
skinsDir = input('Drag directory containing skins here: ')
print('Skins Input: ', skinsDir)

# Input partner art
partnerArtFile = 'C:/Users/Chopper/Desktop/Marketplace/Partner Art/NAME_PartnerArt.png'

# # Input thumbnail
keyArtFile = input('\nDrag 800x450 Key Art here: ')

# # Input marketing key art
keyArtFileHD = input('Drag 1920x1080 Key Art here: ')


# Create Skins array of dictionaries each containing info about a skin
skins = []
for skin in os.listdir(skinsDir):

    # Read image file to find model
    model = ''
    image = imageio.imread(skinsDir+'/'+skin)
    if image[31,54,3] == 0: 
        model = 'geometry.humanoid.customSlim'
    else: model = 'geometry.humanoid.custom'

    if ' ' in skin:
        os.rename(skinsDir+'/'+skin, skinsDir+'/'+(skin.replace(' ','_')))
    
    skins.append({'file':skin, 'name': skin.replace('_',' ').replace('.png','').title(), 'id':skin.replace('_',' ').replace('.png','').title().replace(' ',''), 'model': model})



# ==================================================================================================================#

# Create directory structure for packaging

mainDir = os.mkdir(path)

contentDir = os.mkdir(path+'/Content')
marketingArtDir = os.mkdir(path+'/Marketing Art')
storeArtDir = os.mkdir(path+'/Store Art')

skinPackDir = os.mkdir(path+'/Content/skin_pack')
textsDir = os.mkdir(path+'/Content/skin_pack/texts')


# ==================================================================================================================#

# Create texts folder

languagesFile = open(path+'/Content/skin_pack/texts/languages.json', 'w')
enUSFile = open(path+'/Content/skin_pack/texts/en_US.lang', 'w')

# Write languages.json file
languagesFile.write('[\n\t"en_US"\n]')

# Write en_US file
enUSFile.write('skinpack.'+packID+'='+packName)
for skin in skins:
    skinName = skin['name'] 
    skinID = skin['id']
    enUSFile.write('\nskin.'+packID+'.'+skinID+'='+skinName)

languagesFile.close()
enUSFile.close()


# ==================================================================================================================#

# Manifest JSON
manifestFile = open(path+'/Content/skin_pack/manifest.json', 'w')

manifestFile.write('{\n\t"header": {\n\t\t"name": "pack.name",\n\t\t"version": [1, 0, 0],\n\t\t"uuid": "'+str(uuid.uuid1())+'"\n\t},\n\t"modules": [\n\t\t{\n\t\t\t"version": [1, 0, 0],\n\t\t\t"type": "skin_pack",\n\t\t\t"uuid": "'+str(uuid.uuid1())+'"\n\t\t}\n\t],\n\t"format_version": 1\n}')


# Skins JSON
skinsFile = open(path+'/Content/skin_pack/skins.json', 'w')
skinsFile.write('{\n\t"skins": [')

for i, skin in enumerate(skins):
    skinsFile.write('\n\t\t{')
    skinsFile.write('\n\t\t\t"localization_name": "'+skin['id']+'",')
    skinsFile.write('\n\t\t\t"geometry": "'+skin['model']+'",')
    skinsFile.write('\n\t\t\t"texture": "'+skin['file']+'",')
    skinsFile.write('\n\t\t\t"type": "paid"')
    skinsFile.write('\n\t\t}')
    if i < len(skins)-1: skinsFile.write(',')

skinsFile.write('\n\t],\n\t"serialize_name": "'+packID+'",\n\t"localization_name": "'+packID+'"\n}')

manifestFile.close()
skinsFile.close()


# ==================================================================================================================#

# Move Key Arts
os.rename(keyArtFile, path+'/Store Art/'+packID+'_Thumbnail_0.jpg')
os.rename(keyArtFileHD, path+'/Marketing Art/'+packID+'_MarketingKeyArt.jpg')

# Move Skins
for skin in skins:
    os.rename(skinsDir+'/'+skin['file'], path+'/Content/skin_pack/'+skin['file'])

# Copy Partner Art
shutil.copy(partnerArtFile, path+'/Marketing Art/'+packID+'_PartnerArt.png')

# Delete skins folder
os.rmdir(skinsDir)