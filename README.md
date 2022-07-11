# Holaplex UI

Recommended file structure: 

./holaplex
./holaplex/holaplex (https://github.com/holaplex/holaplex)
./holaplex/holaplex-ui (https://github.com/holaplex/ui)

### On 1st Install 
yarn install all dependencies 
seperately follow instructions for installing holaplex

yarn global add yalc // may need to restart your terminal/vs-code after this


cd path/to/holaplex/ui
npm run build
yalc publish

cd path/to/holaplex/holaplex
yalc add @holaplex/ui
yarn
yarn dev


### After Changes to UI
cd path/to/holaplex/holaplex
yalc remove @holaplex/ui

cd path/to/holaplex/ui
rename version in package.json (i've just been changing the decimals by 1)
delete ./lib
npm run build
yalc publish

cd path/to/holaplex/holaplex
yalc add @holaplex/ui
yarn

