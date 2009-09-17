//
//  PBPrefsWindowController.h
//  GitX
//
//  Created by Christian Jacobsen on 02/10/2008.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "DBPrefsWindowController.h"

@interface PBPrefsWindowController : DBPrefsWindowController {
	/* Outlets for Preference Views */
	IBOutlet NSView *generalPrefsView;
	IBOutlet NSView *integrationPrefsView;
	IBOutlet NSView *updatesPrefsView;
  IBOutlet NSView *reviewBoardPrefsView;

	/* Variables for the Updates View */
	IBOutlet NSPathControl *gitPathController;
	IBOutlet NSImageView *badGitPathIcon;
	IBOutlet NSView *gitPathOpenAccessory;
	NSOpenPanel *gitPathOpenPanel;

  IBOutlet NSButton *reviewBoardEnabled;
  IBOutlet NSTextField *reviewBoardUrl;
  IBOutlet NSTextField *reviewBoardUsername;
  IBOutlet NSTextField *reviewBoardPassword;
}

- (IBAction) checkGitValidity: sender;
- (void)pathCell:(NSPathCell *)pathCell willDisplayOpenPanel:(NSOpenPanel *)openPanel;
- (IBAction) showHideAllFiles: sender;
- (IBAction) resetGitPath: sender;

- (IBAction) reviewBoardEnableEdit: sender;
- (IBAction) reviewBoardUrlEdit: sender;
- (IBAction) reviewBoardUsernameEdit: sender;
- (IBAction) ReviewBoardPasswordEdit: sender;

@end
