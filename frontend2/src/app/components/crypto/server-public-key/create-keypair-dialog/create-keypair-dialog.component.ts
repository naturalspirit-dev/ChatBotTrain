
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { KeyPair } from 'src/app/models/key-pair.model';
import { Response } from 'src/app/models/response.model';
import { ConfigService } from 'src/app/services/config.service';

/**
 * Modal dialog used to create a new keypair for server.
 */
@Component({
  selector: 'app-create-keypair-dialog',
  templateUrl: './create-keypair-dialog.component.html',
  styleUrls: ['./create-keypair-dialog.component.scss']
})
export class CreateKeypairDialogComponent implements OnInit {

  /**
   * Seed for CSRNG generator.
   */
  public seed: string;

  /**
   * Key strength to use when generating key.
   */
  public strength: number;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close self when key has been created
   */
  constructor(
    private configService: ConfigService,
    private dialogRef: MatDialogRef<CreateKeypairDialogComponent>) { }

  /**
   * Implementation of OnInit
   */
  ngOnInit() {

    // Retrieving some default seed for key generating process.
    this.configService.getGibberish(25, 50).subscribe((result: Response) => {
      this.seed = result.result;
    });
  }

  /**
   * Invoked when user wants to create the key pair, after having applied
   * strength and random gibberish.
   */
  public create() {

    // Invoking backend to generate key pair.
    this.configService.generateKeyPair(this.strength, this.seed).subscribe((result: KeyPair) => {

      // Success, closing dialog.
      this.dialogRef.close(true);
    });
  }
}
