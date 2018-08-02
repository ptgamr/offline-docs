import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import DB from './db'

const dbInstance = new DB()

const download = (url, onProgress) =>
  new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.withCredentials = false;
    req.responseType = 'blob';
    // applyRequestHeaders(req, headers);
    req.addEventListener('load', () => {
      if (req.status >= 200 && req.status < 300) {
        resolve(req.response);
      }
    });
    req.addEventListener('progress', (ev) => {
      if (onProgress) {
        onProgress(ev);
      }
    });
    req.addEventListener('error', reject);
    req.addEventListener('abort', reject);
    req.send();
  });

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isReady: false,
      isSupported: true,
      downloadLink: 'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4',
      playableUrl: '',
      viewableImg: '',
      files: []
    }

    this.handleDownloadLinkChange = this.handleDownloadLinkChange.bind(this)
    this.handleDownload = this.handleDownload.bind(this)
  }

  componentWillMount() {
    const isSupported = dbInstance.isSupported()
    if (isSupported) {
      dbInstance.openDB().then(() => {
        this.getFileList()
        this.setState({isSupported: true, isReady: true})
      })
    }
  }

  componentDidMount() {
  }

  getFileList() {
    dbInstance.listFiles().then((files) => {
      console.log(files)
      this.setState({files})
    })
  }

  handleFileSelection(files) {
    const file = files[0]

    dbInstance.storeFiles([{
      name: file.name,
      blob: file,
      lastModifiedDate: Date.now(),
      size: file.size,
    }])
      .then(() => {
        console.log('stored file success')
        if (file.type.indexOf('image/') > -1) {
          this.viewImage({
            blob: file
          });
        }
        this.getFileList()
      })
      .catch(e => {
        console.log('stored file error')
        console.log(e)
      })
  }

  handleDownloadLinkChange(evt) {
    this.setState({downloadLink: evt.target.value})
  }

  handleDownload() {
    const {downloadLink} = this.state

    download(downloadLink)
      .then((blob) => {
        dbInstance.storeFiles([{
          name: downloadLink,
          blob,
          lastModifiedDate: Date.now(),
          size: blob.size
        }]).then(() => {
          this.getFileList()
        })
      })
  }

  play(file) {
    const URL = window.URL || window.webkitURL;
    const playableUrl = URL.createObjectURL(file.blob);
    this.setState({playableUrl, viewImage: ''})

    this.videoElement.src = playableUrl
    this.videoElement.load()
    this.videoElement.onloadeddata = () => this.videoElement.play()
  }

  viewImage(file) {
    const URL = window.URL || window.webkitURL;
    const viewableImage = URL.createObjectURL(file.blob);
    this.setState({viewableImage, playableUrl: ''})

    this.imageElement.src = viewableImage
  }

  render() {
    const {isSupported, files} = this.state
    console.log(files)
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Offline Docs</h1>
        </header>
        <p></p>
        <div className="App-intro">
          {isSupported
            ? <h3>IndexDB is supported... Go ahead</h3>
            : <h3>IndexDB is not supported!!!!</h3>
          }

          <input type="file" onChange={e => this.handleFileSelection(e.target.files)} />
        </div>

        <h3>Or download it (you can play the video after download it)</h3>
        <input type="text" placeholder="Enter downloadable URL..." value={this.state.downloadLink} onChange={this.handleDownloadLinkChange} />
        <button onClick={this.handleDownload}>Download</button>

        <div style={{marginTop: 10, display: this.state.playableUrl ? 'block' : 'none'}}>
          <video ref={video => this.videoElement = video} controls />
        </div>

        <div className="file-input">
          <input type="file" id="input-photo" accept="image/*" onChange={e => this.handleFileSelection(e.target.files)} />
          <label htmlFor="input-photo">Choose or take a photo</label>
        </div>
        <div className="image-wrapper" style={{marginTop: 10, display: this.state.viewableImage ? 'block' : 'none'}}>
          <img ref={img => this.imageElement = img} />
        </div>

        <h3>Files stored in IndexDB:</h3>
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Last Modified Date</th>
              <th>Size (bytes)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, i) => (
              <tr key={i}>
                <td>{file.name}</td>
                <td>{file.lastModifiedDate && file.lastModifiedDate.toString()}</td>
                <td>{file.size} bytes</td>
                <td>
                  {file.name.indexOf('.mp4') > -1 && <button onClick={() => this.play(file)}>Play</button>}
                  {(file.name.indexOf('.png') > -1 || file.name.indexOf('.jpg') > -1) && <button onClick={() => this.viewImage(file)}>View</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
