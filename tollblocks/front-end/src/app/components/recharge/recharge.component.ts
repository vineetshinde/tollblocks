import { Component, OnInit } from "@angular/core";
import { BlockchainAccessService } from "src/app/services/blockchain-access.service";
import { FirebaseAuthenticationService } from "src/app/services/firebase-authentication.service";
import { AngularFirestore } from "@angular/fire/firestore";

@Component({
  selector: "app-recharge",
  templateUrl: "./recharge.component.html",
  styleUrls: ["./recharge.component.css"]
})
export class RechargeComponent implements OnInit {
  rechargeAmount: number = 0;
  previousAmount: number;
  transferFrom: any = null;
  bal: any = null;
  uid: string = "";
  username: any;
  txnSender: any;
  txnReciever: any;
  txnHash: any;
  txnGas: any;
  constructor(
    public eth: BlockchainAccessService,
    public authService: FirebaseAuthenticationService,
    private afFirestore: AngularFirestore
  ) {
    this.initEth();
  }

  ngOnInit() {
    this.authService.userData.subscribe(data => {
      if (data) {
        data.forEach(value => {
          if (value) {
            this.username = value["name"];
          }
        });
      } else {
        console.log("user data not found");
      }
    });
    this.authService.uid.subscribe(uid => {
      this.uid = uid;
      if (uid) {
        this.eth.getBalance(this.uid).then(data => {
          if (data) {
            this.previousAmount = data["value"];
          }
        });
      } else {
        console.log("user id not found");
      }
    });
  }

  initEth() {
    let that = this;
    this.eth
      .getAccountInfo()
      .then((acctInfo: any) => {
        that.transferFrom = acctInfo.fromAccount;
        that.bal = acctInfo.balance;
        console.log("blockchain current account is", {
          from: this.transferFrom,
          balance: this.bal
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  putValueInRechargeInput(val: number) {
    this.rechargeAmount = val;
  }
  hideNotification() {
    document.getElementById("success-recharge").style.display = "none";
    document.getElementById("fail-recharge").style.display = "none";
  }
  userRecharge() {
    if (this.rechargeAmount < 0) {
      document.getElementById("fail-recharge").style.display = "block";
    } else {
      this.eth
        .addBalance(this.uid, this.rechargeAmount, this.transferFrom)
        .then(data => {
          console.log(data);

          this.txnSender = data["receipt"]["from"];
          this.txnReciever = data["receipt"]["from"];
          this.txnHash = data["receipt"]["transactionHash"];
          this.txnGas = data["receipt"]["gasUsed"];
          let txn = {
            sender: this.txnSender,
            reciever: this.txnReciever,
            hash: this.txnHash,
            gas: this.txnGas,
            user_id: this.uid,
            type: "recharge"
          };
          this.afFirestore.collection("transactions").add(txn);
          this.eth.getBalance(this.uid).then(data => {
            if (data) {
              this.previousAmount = data["value"];
              document.getElementById("success-recharge").style.display =
                "block";
              document.getElementById("reciept").style.display = "block";
            }
          });
        });
    }
  }
}
