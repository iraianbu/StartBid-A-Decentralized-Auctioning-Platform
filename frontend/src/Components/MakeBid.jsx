import { Component } from "react";
import { auctions } from "../Resources/auctions";
import { Row, Col, Image, Button, Container, Breadcrumb, BreadcrumbItem, Modal,Jumbotron,Table} from 'react-bootstrap';
import {FaEthereum} from 'react-icons/fa';
import {abi} from "../Resources/abi";
import io from 'socket.io-client'
var endpoint="http://localhost:4000";

const socket = io.connect(endpoint);

class MakeBid extends Component{
    constructor(props){
        super(props);
        this.state = {
            product:{},
            amount:0,
            starttime:0,
            endtime:0,
            auction_bid_modal:false,
            latency:0,
            connectwalletstatus: 'Connect Wallet',
            account_addr: '',
            web3: null,
            setshow:false,
            a:0,
            contractval:'',
            tablearr:[],
            tabletoggle:0
        };
        this.rendercomponent=this.rendercomponent.bind(this);
        this.rendertable=this.rendertable.bind(this);
        this.renderrow=this.renderrow.bind(this);
    }

   async componentDidMount()
    {
        var web3;
        const Web3 = require('web3');
        // web3 lib instance
        if(typeof window.web3 !== 'undefined'){
            web3 = new Web3(window.ethereum);
            // get all accounts
            // const accounts = await web3.eth.getAccounts();
            this.setState({web3: web3});
            this.connect(web3);
            this.initialiseAddress(web3);
        }
        else{
            alert('No web3? Please install the metamask extension and refresh the page');
        }

        if(window.ethereum) {
            window.ethereum.on('accountsChanged', () => {
                this.initialiseAddress(web3);
                console.log("Account changed");
            });
        }

        
        var address = "0xE6CcAFB99015d50D631B2f310B50471EB411f8Da";
        var contract = new web3.eth.Contract(abi, address);

        this.setState({contractval: contract});
        
        var key={id:this.props.productId};
        console.log(key);
        fetch('http://localhost:8000/product',{
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body:JSON.stringify(key)
            }).then((res)=>{
                if(res.ok)
                return res.json();
            }).then((res)=>{
                this.setState({product:res});
                this.setState({a:1});
                this.getalltransactionsblockchain(key);
            })
        
        socket.on('message', data => {
            console.log("recieved");
            var prod_id = this.state.product._id;
            if(data["id"]==prod_id){
                var prod2=this.state.product;
            
                    prod2["price"]=data['news'];
                    prod2["bid_count"]=data['bidcount'];
                    console.log(prod2)

                    this.setState({product:prod2});
                    this.setState({endtime:Date.now()})
                    var latencyval = this.state.endtime - this.state.starttime;
                    this.setState({latency:latencyval});
            }
         });

       
        
    }

    getalltransactionsblockchain(uid){
        // contract.methods.view_all_transactions(uid).call().then(function(result) {
        //     console.log("All transactions");
        //     console.log(result);
        
        // });
    }

    initialiseAddress(web3) {

        web3.eth.getAccounts().then((accounts) => {

            var account_addr = accounts[0];
    
            this.setState({account_addr: accounts[0]});
    
            if(!account_addr) {
                
                this.setState({connectwalletstatus: 'Connect Wallet'});
                return;
            }
    
            const len = account_addr.length;
            const croppedAddress = account_addr.substring(0,6) + "..." + account_addr.substring(len-4, len);
    
            web3.eth.getBalance(account_addr).then((balance) => {
    
                var account_bal = (Math.round(web3.utils.fromWei(balance) * 100) / 100);
                var temp = croppedAddress + " (" + account_bal + " ETH)";
                this.setState({connectwalletstatus: temp});
            });
        });
    }

    connect(web3) {

        window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(this.initialiseAddress(web3))
        .catch((err) => {
        if (err.code === 4001) {
            alert('Please connect to MetaMask.');
        } else {
            console.error(err);
        }
        });
        
    }

   

    rendercomponent()
    {
        if(this.state.a==0)
        {
            return <div></div>
        }
        else{
            if(parseInt(Date.now()/1000)<this.state.product.ending_date)
            {
                // console.log(Date.now())
                // console.log(this.state.product.ending_date);
                return(
                    <>

                    <Modal show={this.state.auction_bid_modal}>
                        <Modal.Header >
                        <Modal.Title>Invalid Bid</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                        <p>Your bid is less than the current bid</p>
                        </Modal.Body>
                        <Modal.Footer>
                        <Button variant="secondary" onClick={()=>{this.setState({auction_bid_modal:false})
                        document.getElementById("bidinput").value="";
                    }}>
                        Close
                    </Button>
                
                    </Modal.Footer>
                </Modal>
                
                <Container>
                    <Row style={{marginTop:'20px'}}>   
                        <Col md={9}>
                            <Breadcrumb>
                                <BreadcrumbItem href="/explore">Explore</BreadcrumbItem>
                                <BreadcrumbItem active>{this.state.product.title}</BreadcrumbItem>
                            </Breadcrumb>
                        </Col>
                        
                        <Col md={3}>
                            <Button 
                            style={{width:'90%', height:'45px', backgroundColor:'#FFA0A0', fontWeight:'bolder', border:'none', color:'#21325E' }}
                            onClick = { () => {
                              
                                var s={news:this.state.amount,id:this.state.product._id,address:this.state.account_addr};
                                if(parseInt(this.state.amount)<parseInt(this.state.product.price))
                                this.setState({auction_bid_modal:true})
                                else
                                socket.emit('change', s);
                                this.setState({starttime:Date.now()})
                            }}> 
                            {this.state.connectwalletstatus}
                            </Button>                     
                         </Col>
                    </Row>
                    <Row style={{marginTop:'30px'}}>
                        <Col md={5}>
                            <Image src={this.state.product.link} height='350px' width='350px'
                                style={{margin:'50px', objectFit:'cover'}}
                            />
                        </Col>
                        <Col md={7} style={{padding:'50px'}}>
                            <Row> 
                                <Col md={1} style={{}}>
                                
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50" cy="50" r="30" className="live-icon"
                                    /> 
                                </svg></Col>
                                <Col md={11} style={{paddingLeft:'0px'}}>
                                <h1 style={{fontWeight:'bolder',paddingLeft:'0px'}}> 
                                
                                {this.state.product.title} </h1>
                                </Col>
                            </Row>

                        
            
                
                            <h5> {this.state.product.description} </h5>
                            <hr /> 
                            <h3 style={{marginTop:'30px'}}> Current Bid : <strong style={{color:'green'}}>{this.state.product.price}</strong> <FaEthereum /></h3>
                            <h5> Number of bidders : <strong> {this.state.product.bid_count} </strong></h5>
                            <h5> Bidders Rate : <strong> 7 / Hr </strong></h5>
                            <hr />
                
                            <Row>
                                <Col md={3}>
                                    <input id="bidinput" onChange={(e)=>{
                                        this.setState({amount:e.target.value})
                                    }} type='number' style={{height:'45px',width:'100%', fontSize:'30px', display:'inline'}} >
                                        
                                    </input> 
                                </Col>
                            
                                <Col md={5}>
                                    <Button  className="btn-lg"
                                        style={{width:'90%', backgroundColor:'#FFA0A0', fontWeight:'bolder', border:'none', color:'#21325E' }}
                                        onClick = { () => {
                                        
                                            var s={news:this.state.amount,id:this.state.product._id,address:this.state.account_addr};
                                            if(parseInt(this.state.amount)<parseInt(this.state.product.price)){
                                                this.setState({auction_bid_modal:true})
                                            }
                                            else{
                                                socket.emit('change', s);
                                                this.setState({starttime:Date.now()})
                                                var auc_id = this.state.product._id;
                                                var ordervals = this.state.product.bid_count;
                                                var biddedvals = parseInt(this.state.amount);
                                                var account_addr = this.state.account_addr;
                                                var contract = this.state.contractval;
                                                contract.methods.make_bid(auc_id, ordervals, biddedvals).send({from:account_addr}).then(function(result) {
                                                    alert("Transaction Successful");
                                                });
                                            }
            
                                        }}
                                    > Make a Bid </Button>
                                </Col>
                                
                                <Col md={4}>
                                <Button className= "authenticate-btn-active" 
                        style={{height:'3rem'}} size='lg' onClick={async ()=> {
                            this.setState({tabletoggle:1});
                        var auc_id = this.state.product._id;
                        var contract = this.state.contractval;
                        await contract.methods.view_all_transactions(auc_id).call().then(async (result)=> {
                            console.log(result.length);
                            var arr=[];
                            for(var i=result.length-1;i>=0;i--)
                            {
                                arr.push(result[i]);
                            }
                            arr.sort((a,b)=>{
                                if(parseInt(a.timestamp)<parseInt(b.timestamp))
                                return 1;
                                if(parseInt(a.timestamp)>parseInt(b.timestamp))
                                return -1;
                                return 0;
                            })
                            
                           
                            var p=[1,2,3];
                            await this.setState({tablearr:arr});
                            console.log(this.state.tablearr);
                         
                        
                        });
                        }}>Get history</Button>
                                </Col>
                            </Row>
                            
                            <p>Measured latency: {this.state.latency} ms</p>
                            </Col>
                        </Row>
                        <Row>
                            
                        <Col md={9}>
                       
                         <h1 className="mt-5">Bid History in Blockchain</h1>
                        </Col>
                        </Row>
                        {this.rendertable()}
                    </Container>
                    </>
                );
            }
            else{
                return(
                    <div style={{textAlign:"center"}}>
               <h1>Auction over</h1>
               <h1>Winner is {this.state.product.winner_address} </h1>
               </div>
                );
             }
        }
              
    }

    renderrow(arr)
    {
        return(
            <tr>
                <td>{arr.order}</td>
                <td>{arr.bid_placer}</td>
                <td>{arr.bidded_value}</td>
            </tr>
        );
    }
    rendertable()
    {
        if(this.state.tabletoggle===1)
        {
            return(
                <Table striped bordered hover >
                <thead>
                   
                    <th>Timestamp</th>
                    <th>Bidder's Address</th>
                    <th>Amount</th>
                </thead>
                <tbody>
                   {this.state.tablearr.map((arr)=>{
                       return this.renderrow(arr);
                   })}
                </tbody>
                </Table>
                );
        }
        else
        return <div></div>
       
    }

    render(){
        return(
            <>
           {this.rendercomponent()}
           
            </>
        )
    };
}

export default MakeBid;