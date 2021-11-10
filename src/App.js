import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import LayerOptions from './LayerOptions/LayerOptions';
import './App.css';

const App = () => {
  const viewer = useRef(null);

  const [ wvInstance, setWvInstance ] = useState(null);
  const [ currentRole, setCurrentRole ] = useState(null);

  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: '/files/PDFTRON_about.pdf',
      },
      viewer.current,
    ).then((instance) => {
      const { documentViewer } = instance.Core;

      documentViewer.addEventListener('documentLoaded', () => {
        setWvInstance(instance);
      });
    });
  }, [ setWvInstance ]);

  useEffect(() => {
    if (!wvInstance) {
      return;
    }
    wvInstance.Core.annotationManager.removeEventListener('annotationChanged');
    wvInstance.Core.annotationManager.addEventListener('annotationChanged', (annotations, action) => {
      if (action === 'add') {
        annotations.forEach(annot => {
          console.log('role', currentRole);
          annot.setCustomData('role', currentRole);
        });
      }
    });
  }, [ wvInstance, currentRole ]);

  return (
    <div className="App">
      <LayerOptions
        setCurrentRole={setCurrentRole}
      />
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
