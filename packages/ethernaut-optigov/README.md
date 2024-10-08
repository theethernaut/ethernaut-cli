# ethernaut-optigov

Tasks for interacting the Optimism retroactive public goods funding rounds (RetroPGF)

## What

This plugin enables seamless interaction with Optimism’s Retroactive Public Goods Funding (RetroPGF) rounds. It allows users to access data on rounds, projects, and votes, streamlining participation and analysis within the Optimism ecosystem. Perfect for tracking funding and engaging with the RetroPGF process.

## Installation

```bash
npm install ethernaut-optigov
```

Import the plugin in your `hardhat.config.js`:

```js
require('ethernaut-optigov')
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import 'ethernaut-optigov'
```

## Required plugins

This plugin doesn't depend on any other plugins.

## Tasks

This plugin adds the tasks listed below.

- login Logs in to the Agora RetroPGF API with SIWE (Sign in with Ethereum)

## Environment extensions

This plugin doesn't extend the hre.

## Configuration

This plugin doesn't add any fields to the hardhat configuration file.

## Usage

Just install it and all tasks will be available with `npx hardhat <task> <params>`
