pipeline {
  agent any
  triggers { pollSCM('') } // 留空=只靠 webhook，不輪詢
  stages {
    stage('Echo') { steps { sh 'echo triggered $(date)' } }
  }
}