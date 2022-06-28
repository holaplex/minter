# Holaplex UI

### On Deploy 
yarn global add yalc // may need to restart your terminal/vs-code after this

cd path/to/holaplex/ui
npm run build
yalc publish

cd path/to/holaplex/holaplex
yalc add @holaplex/ui
yarn


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




NEED TO 

x - ....if add creator or nonprofit...hide the otherone
x - validate non-dupe
x - fix the type % and close for charity
x - RESET search results onClick AND onCancel

X - EACH click on add non-profit should reset the search value field `Search for a nonprofit` like `Enter Creator's`
    - on cancel, on select, or on toggle the other one
X - remove Error handle `Creator address is not valid` on nonprofit search
X - External link `external-link` instead of copy
  

  - Make Error handling for duple check of charity work w/o breaking
UI 

maybe use <DebounceInput> and <Compo> from `holaplex\src\common\components\search\SearchBar.tsx`
https://headlessui.dev/react/listbox