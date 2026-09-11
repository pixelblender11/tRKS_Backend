const mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

const Counter = require('../models/counter.model');

router.get('/generate-dart-model', (req, res) => {
  const mongooseSchema = {
    count: { type: Number, required: true, unique: false },
  };
  //const mongooseSchema = Counter.mongooseSchema;
  const dartClassName = Counter.modelName; // You can dynamically get this from the model name if needed
  let dartModel = `class ${dartClassName} {\n`;

  // Generate Dart model properties
  Object.keys(mongooseSchema).forEach(key => {
    const type = mongooseSchema[key].type;
    const isRequired = mongooseSchema[key].required;
    const dartType = mapMongooseTypeToDartType(type);

    dartModel += `  final ${dartType}${isRequired ? '' : '?'} ${key};\n`;
  });

  // Generate constructor
  dartModel += `\n  ${dartClassName}({\n`;
  Object.keys(mongooseSchema).forEach(key => {
    dartModel += `    required this.${key},\n`;
  });
  dartModel += `  });\n`;

  // Generate fromJson method
  dartModel += `\n  factory ${dartClassName}.fromJson(Map<String, dynamic> json) {\n`;
  dartModel += `    return ${dartClassName}(\n`;
  Object.keys(mongooseSchema).forEach(key => {
    dartModel += `      ${key}: json['${key}'],\n`;
  });
  dartModel += `    );\n  }\n`;

  // Generate toJson method
  dartModel += `\n  Map<String, dynamic> toJson() {\n`;
  dartModel += `    return {\n`;
  Object.keys(mongooseSchema).forEach(key => {
    dartModel += `      '${key}': ${key},\n`;
  });
  dartModel += `    };\n  }\n`;

  dartModel += `}`;

  res.send(`<pre>${dartModel}</pre>`);
});

function mapMongooseTypeToDartType(mongooseType) {
  switch (mongooseType) {
    case 'String':
      return 'String';
    case 'Number':
      return 'int';
    case 'Boolean':
      return 'bool';
    case 'Date':
      return 'DateTime';
    case 'Array':
      return 'List';
    case 'ObjectId':
      return 'String'; // Usually ObjectId is stored as a String in Dart
    default:
      return 'dynamic';
  }
}

module.exports = router;