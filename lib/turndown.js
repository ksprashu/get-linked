/* Turndown - An HTML to Markdown converter
 * Copyright (c) 2017 Dom Christie
 * MIT License
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TurndownService = factory());
}(this, (function () { 'use strict';

  function extend (destination) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) destination[key] = source[key];
      }
    }
    return destination
  }

  function repeat (character, count) {
    return Array(count + 1).join(character)
  }

  function trimLeadingNewlines (string) {
    return string.replace(/^\n*/, '')
  }

  function trimTrailingNewlines (string) {
    return string.replace(/\n*$/, '')
  }

  var blockElements = [
    'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS',
    'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
    'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
    'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES',
    'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD',
    'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
  ];

  function isBlock (node) {
    return is(node, blockElements)
  }

  var voidElements = [
    'AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT',
    'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
  ];

  function isVoid (node) {
    return is(node, voidElements)
  }

  function hasVoid (node) {
    return has(node, voidElements)
  }

  var meaningfulWhenBlankElements = [
    'A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT',
    'AUDIO', 'VIDEO'
  ];

  function isMeaningfulWhenBlank (node) {
    return is(node, meaningfulWhenBlankElements)
  }

  function is (node, tagNames) {
    return tagNames.indexOf(node.nodeName) >= 0
  }

  function has (node, tagNames) {
    return node.getElementsByTagName && tagNames.some(function (tagName) {
      return node.getElementsByTagName(tagName).length
    })
  }

  var rules = {};

  rules.paragraph = {
    filter: 'p',
    replacement: function (content) {
      return '\n\n' + content + '\n\n'
    }
  };

  rules.lineBreak = {
    filter: 'br',
    replacement: function () {
      return '\n'
    }
  };

  rules.heading = {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: function (content, node) {
      var hLevel = Number(node.nodeName.charAt(1));
      var hPrefix = repeat('#', hLevel);
      return '\n\n' + hPrefix + ' ' + content + '\n\n'
    }
  };

  rules.blockquote = {
    filter: 'blockquote',
    replacement: function (content) {
      content = content.replace(/^\n+|\n+$/g, '');
      content = content.replace(/^/gm, '> ');
      return '\n\n' + content + '\n\n'
    }
  };

  rules.list = {
    filter: ['ul', 'ol'],
    replacement: function (content, node) {
      var parent = node.parentNode;
      if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
        return '\n' + content
      } else {
        return '\n\n' + content + '\n\n'
      }
    }
  };

  rules.listItem = {
    filter: 'li',
    replacement: function (content, node, options) {
      content = content
        .replace(/^\n+/, '') // remove leading newlines
        .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
        .replace(/\n/gm, '\n    '); // indent
      var prefix = options.bulletListMarker + ' ';
      var parent = node.parentNode;
      if (parent.nodeName === 'OL') {
        var start = parent.getAttribute('start');
        var index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + '. ';
      }
      return prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
    }
  };

  rules.indentedCodeBlock = {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'indented' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },
    replacement: function (content, node, options) {
      return '\n\n    ' + node.firstChild.textContent.replace(/\n/g, '\n    ') + '\n\n'
    }
  };

  rules.fencedCodeBlock = {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },
    replacement: function (content, node, options) {
      var className = node.firstChild.getAttribute('class') || '';
      var language = (className.match(/language-(\S+)/) || [null, ''])[1];
      var code = node.firstChild.textContent;

      var fenceChar = options.fence.charAt(0);
      var fenceSize = 3;
      var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

      var match;
      while ((match = fenceInCodeRegex.exec(code))) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1;
        }
      }

      var fence = repeat(fenceChar, fenceSize);

      return '\n\n' + fence + (language ? language : '') + '\n' +
        code + '\n' +
        fence + '\n\n'
    }
  };

  rules.horizontalRule = {
    filter: 'hr',
    replacement: function () {
      return '\n\n---\n\n'
    }
  };

  rules.inlineLink = {
    filter: function (node, options) {
      return (
        options.linkStyle === 'inlined' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
      )
    },
    replacement: function (content, node) {
      var href = node.getAttribute('href');
      var title = node.title ? ' "' + node.title + '"' : '';
      return '[' + content + '](' + href + title + ')'
    }
  };

  rules.referenceLink = {
    filter: function (node, options) {
      return (
        options.linkStyle === 'referenced' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
      )
    },
    replacement: function (content, node, options) {
      var href = node.getAttribute('href');
      var title = node.title ? ' "' + node.title + '"' : '';
      var replacement;
      var reference;

      switch (options.linkReferenceStyle) {
        case 'collapsed':
          replacement = '[' + content + '][]';
          reference = '[' + content + ']: ' + href + title;
          break
        case 'shortcut':
          replacement = '[' + content + ']';
          reference = '[' + content + ']: ' + href + title;
          break
        default:
          var id = this.references.length + 1;
          replacement = '[' + content + '][' + id + ']';
          reference = '[' + id + ']: ' + href + title;
      }

      this.references.push(reference);
      return replacement
    },
    references: [],
    append: function (options) {
      var references = '';
      if (this.references.length) {
        references = '\n\n' + this.references.join('\n') + '\n\n';
        this.references = []; // Reset references
      }
      return references
    }
  };

  rules.emphasis = {
    filter: ['em', 'i'],
    replacement: function (content, node, options) {
      if (!content.trim()) return ''
      return options.emDelimiter + content + options.emDelimiter
    }
  };

  rules.strong = {
    filter: ['strong', 'b'],
    replacement: function (content, node, options) {
      if (!content.trim()) return ''
      return options.strongDelimiter + content + options.strongDelimiter
    }
  };

  rules.code = {
    filter: function (node) {
      var hasSiblings = node.previousSibling || node.nextSibling;
      var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;

      return node.nodeName === 'CODE' && !isCodeBlock
    },
    replacement: function (content) {
      if (!content) return ''
      content = content.replace(/\r?\n|\r/g, ' ');

      var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : '';
      var delimiter = '`';
      var matches = content.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';

      return delimiter + extraSpace + content + extraSpace + delimiter
    }
  };

  rules.image = {
    filter: 'img',
    replacement: function (content, node) {
      var alt = node.alt || '';
      var src = node.getAttribute('src') || '';
      var title = node.title || '';
      var titlePart = title ? ' "' + title + '"' : '';
      return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
    }
  };

  function escapeRegExp (string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  var commonmarkRules = Object.assign({}, rules);

  commonmarkRules.heading.replacement = function (content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1));
    var hPrefix = repeat('#', hLevel);
    return '\n\n' + hPrefix + ' ' + content + '\n\n'
  };

  commonmarkRules.list.replacement = function (content, node) {
    var parent = node.parentNode;
    if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
      return '\n' + content
    } else {
      return '\n\n' + content + '\n\n'
    }
  };

  var VOID_ELEMENTS = ['AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'];

  function Node (node) {
    node.isBlock = isBlock(node);
    node.isCode = node.nodeName === 'CODE' || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node);
    return node
  }

  function isBlank (node) {
    return (
      ['A', 'TH', 'TD', 'IFRAME', 'SCRIPT', 'AUDIO', 'VIDEO'].indexOf(node.nodeName) === -1 &&
      /^\s*$/i.test(node.textContent) &&
      !isVoid(node) &&
      !hasVoid(node)
    )
  }

  function flankingWhitespace (node) {
    var leading = '';
    var trailing = '';

    if (!node.isBlock) {
      var hasLeading = /^\s/.test(node.textContent);
      var hasTrailing = /\s$/.test(node.textContent);
      var blankWithSpaces = node.isBlank && hasLeading && hasTrailing;

      if (hasLeading && !isLeftFlankedByWhitespace(node)) {
        leading = ' ';
      }

      if (!blankWithSpaces && hasTrailing && !isRightFlankedByWhitespace(node)) {
        trailing = ' ';
      }
    }

    return { leading: leading, trailing: trailing }
  }

  function isLeftFlankedByWhitespace (node) {
    return (
      node.previousSibling &&
      node.previousSibling.textContent &&
      /\s$/.test(node.previousSibling.textContent)
    )
  }

  function isRightFlankedByWhitespace (node) {
    return (
      node.nextSibling &&
      node.nextSibling.textContent &&
      /^\s/.test(node.nextSibling.textContent)
    )
  }

  var processorRules = { rules: {} };

  var ariaHidden = /^\s*aria-hidden\s*=\s*["']?true["']?\s*$/;

  processorRules.rules.blankRule = {
    filter: function (node) {
      return VOID_ELEMENTS.indexOf(node.nodeName) === -1 &&
        /^\s*aria-hidden\s*=\s*["']?true["']?\s*$/.test(node.getAttribute('aria-hidden'))
    },

    replacement: function () {
      return ''
    }
  };

  var indexOf = Array.prototype.indexOf;
  var every = Array.prototype.every;
  var rules$1 = {};

  rules$1.tableCell = {
    filter: ['th', 'td'],
    replacement: function (content, node) {
      return cell(content, node)
    }
  };

  rules$1.tableRow = {
    filter: 'tr',
    replacement: function (content, node) {
      var borderCells = '';
      var alignMap = { left: ':--', right: '--:', center: ':-:' };

      if (isHeadingRow(node)) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var border = '---';
          var align = (
            node.childNodes[i].getAttribute('align') || ''
          ).toLowerCase();

          if (align) border = alignMap[align] || border;

          borderCells += cell(border, node.childNodes[i]);
        }
      }
      return '\n' + content + (borderCells ? '\n' + borderCells : '')
    }
  };

  rules$1.table = {
    // Only convert tables with a heading row.
    // Tables with no heading row are kept using `keep` (see below).
    filter: function (node) {
      return node.nodeName === 'TABLE' && isHeadingRow(node.rows[0])
    },

    replacement: function (content) {
      // Ensure there are no blank lines
      content = content.replace(/\n+/g, '\n');
      return '\n\n' + content + '\n\n'
    }
  };

  rules$1.tableSection = {
    filter: ['thead', 'tbody', 'tfoot'],
    replacement: function (content) {
      return content
    }
  };

  // A tr is a heading row if:
  // - the parent is a THEAD
  // - or if its the first child of the TABLE or the first TBODY (possibly
  //   following a blank THEAD)
  // - and every cell is a TH
  function isHeadingRow (tr) {
    var parentNode = tr.parentNode;
    return (
      parentNode.nodeName === 'THEAD' ||
      (
        parentNode.firstChild === tr &&
        (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
        every.call(tr.childNodes, function (n) { return n.nodeName === 'TH' })
      )
    )
  }

  function isFirstTbody (element) {
    var previousSibling = element.previousSibling;
    return (
      element.nodeName === 'TBODY' && (
        !previousSibling ||
        (
          previousSibling.nodeName === 'THEAD' &&
          /^\s*$/i.test(previousSibling.textContent)
        )
      )
    )
  }

  function cell (content, node) {
    var index = indexOf.call(node.parentNode.childNodes, node);
    var prefix = ' ';
    if (index === 0) prefix = '| ';
    return prefix + content + ' |'
  }

  var rules$2 = {};

  rules$2.outdent = {
    filter: function (node, options) {
      return !!(options.codeBlockIndentation || node.firstChild.nodeName !== 'PRE')
    },
    replacement: function (content, node, options) {
      return '\n\n' + options.fence + '\n' +
        content +
        '\n' + options.fence + '\n\n'
    }
  };

  rules$2.fencedCode = {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },
    replacement: function (content, node, options) {
      var className = node.firstChild.getAttribute('class') || '';
      var language = (className.match(/language-(\S+)/) || [null, ''])[1];
      var code = node.firstChild.textContent;

      var fenceChar = options.fence.charAt(0);
      var fenceSize = 3;
      var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

      var match;
      while ((match = fenceInCodeRegex.exec(code))) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1;
        }
      }

      var fence = repeat(fenceChar, fenceSize);

      return '\n\n' + fence + (language ? language : '') + '\n' +
        code + '\n' +
        fence + '\n\n'
    }
  };

  rules$2.codeBlock = {
    filter: function (node) {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },
    replacement: function (content, node, options) {
      return '\n\n' + options.fence + '\n' +
        node.firstChild.textContent +
        '\n' + options.fence + '\n\n'
    }
  };

  function TurndownService (options) {
    if (!(this instanceof TurndownService)) return new TurndownService(options)

    var defaults = {
      rules: rules,
      commonmark: false,
      headingStyle: 'setext',
      hr: '* * *',
      bulletListMarker: '*',
      codeBlockStyle: 'indented',
      fence: '```',
      emDelimiter: '_',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
      br: '  ',
      blankReplacement: function (content, node) {
        return node.isBlock ? '\n\n' : ''
      },
      keepReplacement: function (content, node) {
        return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML
      },
      defaultReplacement: function (content, node) {
        return node.isBlock ? '\n\n' + content + '\n\n' : content
      }
    };
    this.options = extend({}, defaults, options);
    this.rules = new Rules(this.options);
  }

  TurndownService.prototype = {
    turndown: function (input) {
      if (!canConvert(input)) {
        throw new TypeError(
          input + ' is not a string, or an element/document/fragment node.'
        )
      }

      if (input === '') return ''

      var output = process.call(this, new RootNode(input));
      return postProcess.call(this, output)
    },

    use: function (plugin) {
      if (Array.isArray(plugin)) {
        for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
      } else if (typeof plugin === 'function') {
        plugin(this);
      } else {
        throw new TypeError('plugin must be a Function or an Array of Functions')
      }
      return this
    },

    addRule: function (key, rule) {
      this.rules.add(key, rule);
      return this
    },

    addRules: function (ruleMap) {
      this.rules.addRules(ruleMap);
      return this
    },

    stringifyNode: function (node) {
      return process.call(this, node)
    },

    keep: function (filter) {
      this.rules.keep(filter);
      return this
    },

    remove: function (filter) {
      this.rules.remove(filter);
      return this
    },

    escape: function (string) {
      return (
        string
          .replace(/^(#{1,6} )/gm, '\\$1')
          .replace(/^([-*_] *){3,}$/gm, function (match, character) {
            return '\\' + match
          })
          .replace(/^(\W)/gm, '\\$1')
          .replace(/^(\d+)\. /gm, '$1\\. ')
          .replace(/^([+-])/gm, '\\$1')
          .replace(/(\*\*|__)(.*?)\1/g, function (match, wrapper, content) {
            wrapper = wrapper.substr(0, 1) === '_' ? '_' : '*';
            return wrapper + content.replace(new RegExp('\\' + wrapper, 'g'), wrapper) + wrapper
          })
          .replace(/(\*|_)(.*?)\1/g, function (match, wrapper, content) {
            return wrapper + content.replace(new RegExp('\\' + wrapper, 'g'), wrapper) + wrapper
          })
          .replace(/(`+)(.*?)\1/g, function (match, wrapper, content) {
            return wrapper + content.replace(/`/g, '`') + wrapper
          })
      )
    }
  };

  function canConvert (input) {
    return (
      input != null && (
        typeof input === 'string' ||
        (input.nodeType && (
          input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11
        ))
      )
    )
  }

  function append (parent, node) {
    parent.appendChild(node);
  }

  function prepend (parent, node) {
    parent.insertBefore(node, parent.firstChild);
  }

  function rootNode (input) {
    return new RootNode(input)
  }

  function RootNode (input) {
    var root;
    if (input.nodeType) root = input;
    else {
      root = document.createElement('div');
      root.innerHTML = input;
    }
    var doc = document.implementation.createHTMLDocument('');
    var clone = root.cloneNode(true);
    doc.documentElement.appendChild(clone);
    this.doc = doc;

    return this
  }

  function Rules (options) {
    this.options = options;
    this._keep = [];
    this._remove = [];

    this.blankRule = { replacement: options.blankReplacement };

    this.keepReplacement = options.keepReplacement;
    this.defaultReplacement = options.defaultReplacement;

    this.array = [];
    for (var key in options.rules) this.array.push(options.rules[key]);
  }

  Rules.prototype = {
    add: function (key, rule) {
      this.array.unshift(rule);
    },

    addRules: function (ruleMap) {
      for (var key in ruleMap) {
        this.array.push(ruleMap[key]);
      }
    },

    keep: function (filter) {
      this._keep.unshift({
        filter: filter,
        replacement: this.keepReplacement
      });
    },

    remove: function (filter) {
      this._remove.unshift({
        filter: filter,
        replacement: function () {
          return ''
        }
      });
    },

    forNode: function (node) {
      if (node.isBlank) return this.blankRule
      var rule;

      if ((rule = findRule(this.array, node, this.options))) return rule
      if ((rule = findRule(this._keep, node, this.options))) return rule
      if ((rule = findRule(this._remove, node, this.options))) return rule

      return { replacement: this.defaultReplacement }
    },

    forEach: function (fn) {
      for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
    }
  };

  function findRule (rules, node, options) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (filterValue(rule, node, options)) return rule
    }
    return void 0
  }

  function filterValue (rule, node, options) {
    var filter = rule.filter;
    if (typeof filter === 'string') {
      if (filter === node.nodeName.toLowerCase()) return true
    } else if (Array.isArray(filter)) {
      if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
    } else if (typeof filter === 'function') {
      if (filter.call(rule, node, options)) return true
    } else {
      throw new TypeError('`filter` needs to be a string, array, or function')
    }
  }

  function process (parentNode) {
    var output = '';
    var rules = this.rules;

    var node = parentNode.firstChild;
    if (!node) return output

    while (node) {
      var replacement = '';
      var isElement = node.nodeType === 1;

      if (isElement) node = new Node(node);
      else if (node.nodeType === 3) {
        if (node.data.trim()) replacement = node.data;
        else if (!isLeftFlankedByWhitespace(node) && !isRightFlankedByWhitespace(node)) {
          replacement = ' ';
        }
      }

      if (isElement) {
        var rule = rules.forNode(node);
        replacement = rule.replacement.call(this, node.textContent, node, this.options);
      }

      if (replacement) {
        output += replacement;
      }

      node = node.nextSibling;
    }

    return output
  }

  function postProcess (output) {
    var self = this;
    this.rules.forEach(function (rule) {
      if (typeof rule.append === 'function') {
        output = output + rule.append(self.options);
      }
    });

    return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '')
  }

  TurndownService.commonmark = function () {
    var service = new TurndownService();
    service.use([
      function (service) {
        service.options.defaultReplacement = function (content) {
          return content
        };
      },
      function (service) {
        var key;
        for (key in commonmarkRules) {
          service.addRule(key, commonmarkRules[key]);
        }
      }
    ]);
    return service
  };

  TurndownService.prototype.use = function (plugins) {
    if (plugins == null) return this
    if (Array.isArray(plugins)) {
      for (var i = 0; i < plugins.length; i++) {
        this.use(plugins[i]);
      }
    } else if (typeof plugins === 'function') {
      plugins(this);
    } else {
      throw new TypeError('Expected plugin(s) to be Function or Array')
    }
    return this
  };

  return TurndownService;

})));
