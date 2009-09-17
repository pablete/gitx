//
//  PBPrefsWindowController.m
//  GitX
//
//  Created by Christian Jacobsen on 02/10/2008.
//  Copyright 2008 __MyCompanyName__. All rights reserved.
//

#import "PBPrefsWindowController.h"
#import "PBGitRepository.h"

@implementation PBPrefsWindowController

# pragma mark DBPrefsWindowController overrides
- (void) awakeFromNib {
  NSLog(@"EN AWAKE FROM NOB");
  NSNumber *onoff = [[NSUserDefaults standardUserDefaults] objectForKey:@"ReviewBoardEnable"];
  if (onoff != NULL) {
    if([onoff intValue]==0) {
      [reviewBoardEnabled setState:NSOffState];
    } else {
      [reviewBoardEnabled setState:NSOnState];
    }
    [self reviewBoardEnableEdit:reviewBoardEnabled];
  }
  id url = [[NSUserDefaults standardUserDefaults] objectForKey:@"ReviewBoardUrl"];
  if (url != NULL) {
    [reviewBoardUrl setStringValue:url];
  }
  id username = [[NSUserDefaults standardUserDefaults] objectForKey:@"ReviewBoardUsername"];
  if (username != NULL) {
    [reviewBoardUsername setStringValue:username];
  }
  id password = [[NSUserDefaults standardUserDefaults] objectForKey:@"ReviewBoardPassword"];
  if (password != NULL) {
    [reviewBoardPassword setStringValue:password];
  }
}

- (void)setupToolbar
{
	// GENERAL
	[self addView:generalPrefsView label:@"General" image:[NSImage imageNamed:@"gitx"]];
	// INTERGRATION
	[self addView:integrationPrefsView label:@"Integration" image:[NSImage imageNamed:NSImageNameNetwork]];
	// UPDATES
	[self addView:updatesPrefsView label:@"Updates" image:[NSImage imageNamed:@"Updates"]];
  // REVIEWBOARD
	[self addView:reviewBoardPrefsView label:@"ReviewBoard" image:[NSImage imageNamed:@"ReviewBoard"]];

}

#pragma mark -
#pragma mark Delegate methods

- (IBAction) checkGitValidity: sender
{
	// FIXME: This does not work reliably, probably due to: http://www.cocoabuilder.com/archive/message/cocoa/2008/9/10/217850
	//[badGitPathIcon setHidden:[PBGitRepository validateGit:[[NSValueTransformer valueTransformerForName:@"PBNSURLPathUserDefaultsTransfomer"] reverseTransformedValue:[gitPathController URL]]]];
}

- (IBAction) resetGitPath: sender
{
	[[NSUserDefaults standardUserDefaults] removeObjectForKey:@"gitExecutable"];
}

- (IBAction) reviewBoardEnableEdit: sender
{
  BOOL newBtnState = [sender state];
  if (newBtnState == NSOnState) {
    [reviewBoardUrl setEnabled:YES];
    [reviewBoardUsername setEnabled:YES];
    [reviewBoardPassword setEnabled:YES];
  } else {
    [reviewBoardUrl setEnabled:NO];
    [reviewBoardUsername setEnabled:NO];
    [reviewBoardPassword setEnabled:NO];
  }
  NSNumber *enabled = [NSNumber numberWithBool:newBtnState == NSOnState];
	[[NSUserDefaults standardUserDefaults] setObject:enabled
                                            forKey:@"ReviewBoardEnable"];
}

- (IBAction) reviewBoardUrlEdit: sender
{
   [[NSUserDefaults standardUserDefaults] setObject:(NSString *)[sender stringValue]
                                             forKey:@"ReviewBoardUrl"];
}

- (IBAction) reviewBoardUsernameEdit: sender
{
  [[NSUserDefaults standardUserDefaults] setObject:(NSString *)[sender stringValue]
                                            forKey:@"ReviewBoardUsername"];
}

- (IBAction) ReviewBoardPasswordEdit: sender
{
  [[NSUserDefaults standardUserDefaults] setObject:(NSString *)[sender stringValue]
                                            forKey:@"ReviewBoardPassword"];
}


- (void)pathCell:(NSPathCell *)pathCell willDisplayOpenPanel:(NSOpenPanel *)openPanel
{
	[openPanel setCanChooseDirectories:NO];
	[openPanel setCanChooseFiles:YES];
	[openPanel setAllowsMultipleSelection:NO];
	[openPanel setTreatsFilePackagesAsDirectories:YES];
	[openPanel setAccessoryView:gitPathOpenAccessory];
	//[[openPanel _navView] setShowsHiddenFiles:YES];

	gitPathOpenPanel = openPanel;
}

#pragma mark -
#pragma mark Git Path open panel actions

- (IBAction) showHideAllFiles: sender
{
	/* FIXME: This uses undocumented OpenPanel features to show hidden files! */
	NSNumber *showHidden = [NSNumber numberWithBool:[sender state] == NSOnState];
	[[gitPathOpenPanel valueForKey:@"_navView"] setValue:showHidden forKey:@"showsHiddenFiles"];
}

@end
