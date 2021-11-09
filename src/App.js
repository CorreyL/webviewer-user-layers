import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import LayerOptions from './LayerOptions/LayerOptions';
import './App.css';

const App = () => {
  const viewer = useRef(null);

  const [ wvInstance, setWvInstance ] = useState(null);

  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: '/files/PDFTRON_about.pdf',
      },
      viewer.current,
    ).then((instance) => {
      const { docViewer } = instance;

      docViewer.on('documentLoaded', () => {
        setWvInstance(instance);
      });
    });
  }, [ setWvInstance ]);


  return (
    <div className="App">
      <LayerOptions/>
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
