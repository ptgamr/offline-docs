import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import DB from './db'

const dbInstance = new DB()

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isReady: false,
      isSupported: true,
      files: []
    }
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

        <h3>Files stored in IndexDB:</h3>
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Last Modified Date</th>
              <th>Size (bytes)</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, i) => (
              <tr key={i}>
                <td>{file.name}</td>
                <td>{file.lastModifiedDate.toString()}</td>
                <td>{file.size} bytes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
