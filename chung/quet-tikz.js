(function(){
  'use strict';
  function mask(text){return text.replace(/(^|[^\\])%[^\r\n]*/gm,function(all,prefix){return prefix+' '.repeat(all.length-prefix.length);});}
  // Balanced arguments keep multiline tikzset and nested macro declarations intact.
  function declarations(text){
    var clean=mask(text),re=/\\(?:tikzset|tikzstyle|pgfkeys|pgfplotsset|usetikzlibrary|usepgfplotslibrary|newcommand\*?|renewcommand\*?|providecommand\*?|def|pgfmathdeclarefunction|pgfmathsetmacro|pgfmathsetlengthmacro|definecolor|colorlet)(?![a-zA-Z@])/g,match,parts=[];
    while((match=re.exec(clean))){var start=match.index,i=re.lastIndex,def=/\\def$/.test(match[0]),style=/tikzstyle$/.test(match[0]),maxGroups=/command|declarefunction|definecolor/.test(match[0])?3:/setmacro|setlengthmacro|colorlet|tikzstyle/.test(match[0])?2:1,groups=0;
      if(def){var name=clean.slice(i).match(/^\s*\\[a-zA-Z@]+[^\{\r\n]{0,200}/);if(name)i+=name[0].length;}
      while(i<clean.length){while(/\s/.test(clean[i]||'')&&i<clean.length)i++;if(clean[i]==='\\'&&groups===0){var macro=clean.slice(i).match(/^\\[a-zA-Z@]+/);if(macro){i+=macro[0].length;groups++;continue;}}
        if(style&&groups===1&&clean[i]==='='){i++;continue;}
        if(clean[i]!=='{'&&clean[i]!=='[')break;var open=clean[i],close=open==='{'?'}':']',depth=1;i++;while(i<clean.length&&depth){if(clean[i]==='\\'){i+=2;continue;}if(clean[i]===open)depth++;else if(clean[i]===close)depth--;i++;}if(depth)throw Error('Style hoặc macro chưa đóng ngoặc.');if(open==='{')groups++;if(style&&open==='[')break;if(groups>=maxGroups)break;
      }parts.push(text.slice(start,i).trimEnd());re.lastIndex=i;
    }return parts.join('\n');
  }
  function split(text,name){
    if(typeof text!=='string'||text.length>2000000)throw Error('File tối đa 2 triệu ký tự.');var clean=mask(text),token=/\\(begin|end)\s*\{tikzpicture\}/g,m,active=-1,pictures=[];
    while((m=token.exec(clean))){if(m[1]==='begin'){if(active>=0)throw Error('Không hỗ trợ tikzpicture lồng nhau.');active=m.index;}else{if(active<0)throw Error('Có end{tikzpicture} nhưng thiếu begin.');pictures.push({start:active,end:token.lastIndex,source:text.slice(active,token.lastIndex)});active=-1;}}
    if(active>=0)throw Error('Có hình thiếu end{tikzpicture}.');if(!pictures.length)throw Error('Không tìm thấy tikzpicture.');
    var external='',last=0;pictures.forEach(function(p){external+=text.slice(last,p.start)+'\n';last=p.end;});external+=text.slice(last);var context=declarations(external);if(context.length>30000)throw Error('Các style/macro ngoài hình vượt 30.000 ký tự. Hãy chia nhỏ file.');
    return pictures.map(function(p,i){if(p.source.length>150000)throw Error('Một hình quá dài (tối đa 150.000 ký tự).');return {file:name||'Mã đã dán',number:i+1,original:p.source,context:context};});
  }
  window.QuetTikz={split:split,declarations:declarations};
})();
