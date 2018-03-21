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
      downloadLink: 'http://static.videogular.com/assets/videos/videogular.mp4',
      playableUrl: '',
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
    dbInstance.storeFiles(files)
      .then(() => {
        console.log('stored file success')
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
    console.log(file.blob)
    const URL = window.URL || window.webkitURL;
    const playableUrl = URL.createObjectURL(file.blob);
    this.setState({playableUrl})

    this.videoElement.src = playableUrl
    this.videoElement.load()
    this.videoElement.onloadeddata = () => this.videoElement.play()
  }

  render() {
    const {isSupported, files} = this.state
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

        <h3>Or download it</h3>
        <input type="text" placeholder="Enter downloadable URL..." value={this.state.downloadLink} onChange={this.handleDownloadLinkChange} />
        <button onClick={this.handleDownload}>Download</button>

        <div style={{marginTop: 10, display: this.state.playableUrl ? 'block' : 'none'}}>
          <video ref={video => this.videoElement = video} controls />
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
                <td>{file.name.indexOf('.mp4') > -1 && <button onClick={() => this.play(file)}>Play</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
