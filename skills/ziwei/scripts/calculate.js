#!/usr/bin/env node
'use strict';
const { analyze } = require('../lib/analyze');
require('../../_shared/json-cli').runJsonCli(analyze);
