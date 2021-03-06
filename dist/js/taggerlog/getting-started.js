
'use strict';
/** @suppress {duplicate} */
var taggerlog = taggerlog || {};

(function(tl) {
  tl.gettingStartedEntries = [
    {
      'text': 'This is an entry with some tags. Tap it to edit or delete.',
      'tags': ['getting-started', 'entries']
    },
    {
      'text': 'The tags panel has the tags from all your entries. ' +
          'Clicking a tag makes it green and ACTIVE.',
      'tags': ['getting-started', 'tags']
    },
    {
      'text': 'Only entries matching active tags are displayed.\n\n'  +
          'Active tags are automatically added to new entries.',
      'tags': ['getting-started', 'tags', 'entries']
    },
    {
      'text': 'Holding a tag turns it red, making it EXCLUDED.\n\n' +
              'Entries tagged with excluded tags are not displayed.',
      'tags': ['getting-started', 'tags', 'entries']
    },
    {
      'text': 'This is demo application. Any entries will be lost!',
      'tags': ['warning', 'this-is-a-demo'] 
    },
  ];
})(taggerlog);