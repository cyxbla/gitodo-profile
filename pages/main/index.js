import React from 'react';
import {connect} from 'react-redux';
import Head from 'next/head';
import styles from '../../styles/Home.module.css';
import Header from '../../components/header';
import MainTaskView from '../../components/mainTaskView';
import Footer from '../../components/footer';
import { getLine, getNodesByLine } from '../../api/line';
import { getUser } from '../../api/user';
import {endListAllLineClear, listAllLine_more, listMainBranch, endListTaskClear, listAllTask_more} from '../../redux/actions/branchActions';
import { modifyNode } from '../../api/node';
import Router from 'next/router';

let qs = require('qs');
class Home extends React.Component{
  
  constructor(props) {
    super(props);

    this.state = {
      /* TODO: change to state not redux */
      all_line: [],
      task: [],
    };

    this.getAllBranches = this.getAllBranches.bind(this);
    this.getAllTasks = this.getAllTasks.bind(this);
    this.handleTaskDone = this.handleTaskDone.bind(this);
    this.handleTaskUndone = this.handleTaskUndone.bind(this);
    this.checkLogin = this.checkLogin.bind(this);

    this.checkLogin();
  }

  componentDidMount() {
    if(this.props.userId != -1) {
      this.props.listMainBranch(this.props.userId);
      setTimeout(() => {this.getAllBranches(this.props.mainLine, Date.now(), 0);
      setTimeout(() => {this.getAllTasks(this.props.allLine, this.props.allLine.length, 1);}, 500);}, 100);
    }
  }

  render() {
    return (
      <>
      {
      this.props.userId != -1 && 
      <div className={styles.container}>
        <Head>
          <title>GitoDo</title>
          <meta name='description' content='Generated by create next app' />
          <link rel='icon' href='/favicon.ico' />
        </Head>
  
        <Header></Header>
  
        <main className={styles.main + ' bg-gray-100 relative'}>
          <div className='sm:top-28 top-24 lg:right-7 right-2 lg:left-80 left-20 px-10 absolute w-auto'>
            <div className='container flex flex-row mx-auto items-center'>
              <h1 className='text-2xl font-semibold'>Task</h1>
              <div className='flex-grow' />
            </div>
          </div>
          <MainTaskView task={this.props.task} onTaskDone={this.handleTaskDone} onTaskUndone={this.handleTaskUndone}></MainTaskView>
        </main>
  
        <Footer></Footer>
      </div>
      }
      </>  
    );
  }

  checkLogin(){
    if(this.props.userId == -1){
      Router.push({
        pathname: '/login',
        query: {},
      }, `/login`);
    }
  }

  getAllBranches(LineObject, comtime, level) {
    if(LineObject == this.props.mainLine) {
      this.props.listAllLineClear();
      this.props.listAllLineMore(LineObject, 'you', LineObject, comtime - 100)
    }
    getNodesByLine(LineObject._id, 0, 1000, 0).then(task => {
      for(let i = 0; i < task.length; i++) {
        if(task[i].branch_line_id) {
          getLine(task[i].branch_line_id[0]).then(Line => {
            getUser(Line.owner).then(res => {
              let owner = res.name;
              this.props.listAllLineMore(Line, owner, LineObject, comtime + i * Math.pow(1000, 1-level))
            })
            if(Line.contain_branch > 0) {
              this.getAllBranches(Line, comtime + 1, level+1)
            }
          })
        }
      }
    })
  }

  getAllTasks(LineObject, limit, now) {
    if(now == 1) {
      this.props.listAllTaskClear();
    }
    if(now < limit){
      /* inf as 1000 = anout */
      getNodesByLine(LineObject[now].Line._id, 0, 1000, 0).then(task => {
        /*inside here and compare */
        let task_new = [{_id:'0'}];
        let state_task = this.props.task
        let state_i = 1;
        let action_i = 0;
        while (state_i < state_task.length || action_i < task.length) {
          if(state_i >= state_task.length && action_i < task.length) {
            task_new = [...task_new, {task:task[action_i], line:LineObject[now].Line}];
            action_i++;
          }
          else if(state_i < state_task.length && action_i >= task.length) {
            task_new = [...task_new, state_task[state_i]];
            state_i++;
          }
          else {
            let state_ms = Date.parse(state_task[state_i].task.due_date);
            let action_ms = Date.parse(task[action_i].due_date);
            if(state_ms <= action_ms) {
              task_new = [...task_new, state_task[state_i]];
              state_i++;
            } else {
              task_new = [...task_new, {task:task[action_i], line:LineObject[now].Line}];
              action_i++;
            }
          }
        }
        // console.log('result', task_new);
        this.props.listAllTaskMore(task_new);
      })
      if(this.props.loading == false)
        this.getAllTasks(LineObject, limit, now+1)
    }
  }

  handleTaskDone(id, time) {
    this.setState({
      loading: true,
    }, () => {
      let data = qs.stringify({
        'achieved': true,
        'achieved_at': time
      })
      modifyNode(id, data).then(() => {
        this.getAllTasks(this.props.allLine, this.props.allLine.length, 1);
      })
      this.setState({
        loading: false,
      })
    })
  }

  handleTaskUndone(id) {
    this.setState({
      loading: true,
    }, () => {
      let data = qs.stringify({
        'achieved': false,
        'achieved_at': 'null',
      })
      modifyNode(id, data).then(() => {
        this.getAllTasks(this.props.allLine, this.props.allLine.length, 1);
      })
      this.setState({
        loading: false,
      })
    })
  }
}

const mapStateToProps = state => ({
  userId: state.login.userId,
  mainLine: state.branch.mainLine,
  branchLoading: state.branch.branchLoading,
  allLine: state.branch.allLine,
  task: state.branch.task,
  loading: state.branch.branchLoading,
});

const mapDispatchToProps = {
  listMainBranch: listMainBranch,
  listAllLineClear: endListAllLineClear,
  listAllLineMore: listAllLine_more,
  listAllTaskClear: endListTaskClear,
  listAllTaskMore: listAllTask_more,
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
