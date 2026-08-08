# Installation

## macOS

1. Remove any earlier UM Sans test build from Font Book.
2. Install either all files in `Desktop/OTF` or all files in `Desktop/TTF`, not both.
3. Restart applications that were open during installation.

## Windows

1. Remove earlier test builds in Settings > Personalization > Fonts.
2. Select all files in `Desktop/TTF`, right-click and choose **Install for all users**.
3. Restart Office and Adobe applications.

## Adobe and publishing

Use the OTF static family for fixed-layout print production. Use Regular,
Italic, Bold and Bold Italic for maximum legacy style-linking compatibility.
The remaining weights appear under the typographic family `UM Sans` in modern
applications and as linked legacy subfamilies where required.

## Web

Copy `Web` to the public asset directory and load `Web/um-sans.css`. Prefer the
two variable WOFF2 files. Preload Roman only; Italic should load on demand.

## Do not

- install OTF and TTF copies simultaneously;
- synthesize bold or italic;
- rename the binaries without also rebuilding OpenType names;
- use the logo wordmark as ordinary text: Futura PT remains the logo font.
