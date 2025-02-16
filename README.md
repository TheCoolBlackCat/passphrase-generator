# Passphrase Generator

Generate passphrases with a set length, to comply with frustrating requirements from certain websites.

## Usage

### Install globally
In the module directory, run:
```bash
npm i -g
```

### Run within module
For testing/demo purpose, you can run without installing using `yarn start` in place of `npx passphrase-gen`.

### CLI

```bash
npx passphrase-gen -l 20
npx passphrase-gen -l 40
npx passphrase-gen -l 40 --stats
```

![Demo of the commands listed above](res/demo2.gif)

### Interactive Wizard

```bash
npx passphrase-gen
```

![Demo of the interactive UI](res/demo1.gif)
