const HF_PREFIX = 'h__';

function genUID(length = 8) {
  let uid = '';
  for (let i = 0; i < length; ++i) {
    let rand = Math.random()*36;
    uid += String.fromCharCode(
      rand < 26 ? 65 + rand : (rand < 52 ? 97 + rand - 26 : 48 + rand - 52));
  }
  return uid;
}

function parentsList(node) {
  let parentsList = [];
  while (node) {
    parentsList.push(node);
    node = node.parentNode;
  }
  return parentsList;
}

function lca(nodeA, nodeB) {
  let parentsA = parentsList(nodeA);
  let parentsB = parentsList(nodeB);

  for (let parentA of parentsA) {
    for (let parentB of parentsB) {
      if (parentA == parentB) {
        return parentA;
      }
    }
  }

  return null;
}

function getFragmentId(element) {
  let id = null;
  for (let cls of element.classList) {
    if (cls.match(/^[A-Za-z0-9]{8}$/)) {
      id = cls;
    }
  }
  return id;
}

function getHighlightFragmentId(element) {
  let id = null;
  for (let cls of element.classList) {
    if (cls.match(new RegExp(`^${HF_PREFIX}[A-Za-z0-9]{8}$`))) {
      id = cls;
    }
  }
  return id;
}

function getLeftmostLeafNode(node) {
  if (node.children.length == 0) {
    return node;
  } else {
    return getLeftmostLeafNode(node.children[0]);
  }
}

function loadHighlighs() {
  let userId = '1';
  let postId = '1';
  
  $.ajax({
    method: 'POST',
    url: 'highlight_get.php',
    data: { userId, postId }
  }).done(function (data) {
    for (let highlight of data) {
      let { anchorNodeId, focusNodeId, anchorOffset, focusOffset } = highlight; 
      if (document.getElementById(anchorNodeId)) {
        document.getElementById(anchorNodeId).classList.add(anchorNodeId);
      }
      if (document.getElementById(focusNodeId)) {
        document.getElementById(focusNodeId).classList.add(focusNodeId);
      }
      addHighlight(anchorNodeId, focusNodeId, anchorOffset, focusOffset);
    }
  });
}

function addHighlightEventHandler() {  
  let selection = document.getSelection();
  let anchorNode = selection.anchorNode;
  if (anchorNode.nodeType == Node.TEXT_NODE) {
    anchorNode = anchorNode.parentNode;
  }
  let focusNode = selection.focusNode;
  if (focusNode.nodeType == Node.TEXT_NODE) {
    focusNode = focusNode.parentNode;
  }
 
  if (!anchorNode || !focusNode
      || anchorNode.tagName != 'SPAN' 
      || focusNode.tagName != 'SPAN') 
  {
    return;
  }

  let postId = null;
  let postNode = anchorNode;
  while (postNode && postNode.tagName != 'ARTICLE') {
    postNode = postNode.parentNode;
  }
  if (postNode) {
    postId = postNode.id.split('-')[1];
  }
  if (!postId) {
    return;
  }

  if (anchorNode.id) {
    anchorNode.classList.add(anchorNode.id);
  }
  if (focusNode.id) {
    focusNode.classList.add(focusNode.id);  
  }

  let anchorNodeId = getFragmentId(anchorNode);
  let focusNodeId = getFragmentId(focusNode);
  if (!anchorNodeId || !focusNodeId) {
    return;
  }

  let anchorOffset = selection.anchorOffset;
  let focusOffset = selection.focusOffset;

  for (let node of document.getElementsByClassName(anchorNodeId)) {
    if (node != anchorNode) {
      anchorOffset += node.textContent.length;
    } else {
      break;
    }
  }

  for (let node of document.getElementsByClassName(focusNodeId)) {
    if (node != focusNode) {
      focusOffset += node.textContent.length;
    } else {
      break;
    }
  }

  let highlightObject = { 
    postId, 
    authorId: 1, 
    anchorNodeId, 
    focusNodeId, 
    anchorOffset, 
    focusOffset 
  };
  
  console.log(`send highlight to backend: ${JSON.stringify(highlightObject)}`);
  $.ajax({
    method: 'POST',
    url: 'highlight_add.php',
    data: highlightObject
  }).done(function(highlight) {
    let { anchorNodeId, focusNodeId, anchorOffset, focusOffset } = highlight; 
    addHighlight(anchorNodeId, focusNodeId, anchorOffset, focusOffset);
  }).fail(function() {
    alert("Can't save highlight");
  });

  selection.removeAllRanges();
}

function addHighlight(anchorNodeId, focusNodeId, anchorOffset, focusOffset) {
  anchorOffset = parseInt(anchorOffset);
  focusOffset = parseInt(focusOffset);

  if (isNaN(anchorOffset) || isNaN(focusOffset)) {
    return;
  }

  let anchorNode = null; 
  for (let node of document.getElementsByClassName(anchorNodeId)) {
    if (anchorOffset > node.textContent.length) {
      anchorOffset -= node.textContent.length;
    } else {
      anchorNode = node;
      break;
    }
  }

  let focusNode = null;
  for (let node of document.getElementsByClassName(focusNodeId)) {
    if (focusOffset > node.textContent.length) {
      focusOffset -= node.textContent.length;
    } else {
      focusNode = node;
      break;
    }
  }

  if (!anchorNode || !focusNode) {
    return;
  }

  let uid = genUID();
  
  if (anchorNode == focusNode) {
    let reversed = anchorOffset > focusOffset;
    
    let preHighlightContent = anchorNode.textContent.substring(0, anchorOffset);
    let sufHighlightContent = anchorNode.textContent.substring(focusOffset);
    let highlightContent = anchorNode.textContent.substring(anchorOffset, focusOffset);
    if (reversed) {
      preHighlightContent = anchorNode.textContent.substring(0, focusOffset);
      sufHighlightContent = anchorNode.textContent.substring(anchorOffset);
      highlightContent = anchorNode.textContent.substring(focusOffset, anchorOffset);
    }
    
    let preHighlight = document.createElement('SPAN');
    preHighlight.textContent = preHighlightContent;
    for (let cls of anchorNode.classList) {
      preHighlight.classList.add(cls);
    }
    
    let sufHighlight = document.createElement('SPAN');
    sufHighlight.textContent = sufHighlightContent;
    for (let cls of anchorNode.classList) {
      sufHighlight.classList.add(cls);
    }
    
    anchorNode.textContent = highlightContent;
    anchorNode.classList.add(HF_PREFIX);
    anchorNode.classList.add(HF_PREFIX + uid);
    
    anchorNode.parentNode.insertBefore(preHighlight, anchorNode);
    anchorNode.parentNode.insertBefore(sufHighlight, anchorNode.nextSibling);
  } else {
    let reversed = anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_PRECEDING;

    let anchorTextContent = anchorNode.textContent.substring(anchorOffset);
    let anchorNonHighlightContent = anchorNode.textContent.substring(0, anchorOffset);
    let anchorBeforeRef = anchorNode;
    if (reversed) {
      anchorTextContent = anchorNode.textContent.substring(0, anchorOffset);
      anchorNonHighlightContent = anchorNode.textContent.substring(anchorOffset);
      anchorBeforeRef = anchorNode.nextSibling;
    }
   
    let anchorNonhighlight = document.createElement('SPAN');
    anchorNonhighlight.textContent = anchorNonHighlightContent;
    for (let cls of anchorNode.classList) {
      anchorNonhighlight.classList.add(cls);
    }
    
    anchorNode.textContent = anchorTextContent;
    anchorNode.classList.add(HF_PREFIX);
    anchorNode.classList.add(HF_PREFIX + uid);
    anchorNode.parentNode.insertBefore(anchorNonhighlight, anchorBeforeRef);
      
    let focusTextContent = focusNode.textContent.substring(0, focusOffset);
    let focusNonhighlightContent = focusNode.textContent.substring(focusOffset);
    let focusBeforeRef = focusNode.nextSibling;
    if (reversed) {
      focusTextContent = focusNode.textContent.substring(focusOffset);
      focusNonhighlightContent = focusNode.textContent.substring(focusOffset, 0);
      focusBeforeRef = focusNode;
    }
    
    let focusNonhighlight = document.createElement('SPAN');
    focusNonhighlight.textContent = focusNonhighlightContent;
    for (let cls of focusNode.classList) {
      focusNonhighlight.classList.add(cls);
    }

    focusNode.textContent = focusTextContent;
    focusNode.classList.add(HF_PREFIX);
    focusNode.classList.add(HF_PREFIX + uid);
    focusNode.parentNode.insertBefore(focusNonhighlight, focusBeforeRef);
    
    let startNode = anchorNode;
    let endNode = focusNode;
    if (reversed) {
      startNode = focusNode;
      endNode = anchorNode;
    } 

    let commonAncestor = lca(anchorNode, focusNode);
    for (let el of commonAncestor.getElementsByTagName('SPAN')) {
      if (startNode.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
        el.classList.add(HF_PREFIX);
        el.classList.add(HF_PREFIX + uid);
      }
      if (el == endNode || endNode.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
        break;
      }
    }
  }

  $(`.${HF_PREFIX}`).on('mouseover', function(event) {
    let id = getHighlightFragmentId(event.target);
    if (id) {
      $(`.${id}`).css('background', 'gray');
    }
  });

  $(`.${HF_PREFIX}`).on('mouseout', function(event) {
    let id = getHighlightFragmentId(event.target);
    if (id) {
      $(`.${id}`).css('background', 'lightgray');
    }
  });

}


function ready(fn) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function debounce(fn, delay) {
  let timeout = null;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  }
}

ready(function() {
  let pointerCoordinate = { clientX: 0, clientY: 0 };

  let selBox = function() { return document.getElementById('selBox'); };

  let addHighlightPopup = function() {
    let sel = document.getSelection();
    if (sel.anchorNode && sel.focusNode && sel.anchorOffset != sel.focusOffset) {
      selBox().style.left = pointerCoordinate.clientX + 4 + 'px';
      selBox().style.top = pointerCoordinate.clientY + 4 + 'px';
      selBox().style.display = 'block';
    } else {
      selBox().style.display = 'none';
    }
  };

  window.addEventListener('mousemove', function(event) {
    pointerCoordinate.clientX = event.clientX;
    pointerCoordinate.clientY = event.clientY;
  });

  window.addEventListener('mousemove', debounce(addHighlightPopup, 200));
  
  document.addEventListener('selectionchange', debounce(addHighlightPopup, 200));

  document.getElementById('addHighlight').addEventListener(
    'click', 
    addHighlightEventHandler
  );

  loadHighlighs();
});
