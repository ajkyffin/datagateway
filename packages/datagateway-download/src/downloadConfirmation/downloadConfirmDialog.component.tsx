import React, { useEffect } from 'react';

import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles,
  StyleRules,
} from '@material-ui/core/styles';
import {
  Typography,
  IconButton,
  Button,
  TextField,
  Grid,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  FormHelperText,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { formatBytes } from 'datagateway-common';
import {
  submitCart,
  downloadPreparedCart,
} from '../downloadCart/downloadCartApi';
import Mark from './mark.component';

const dialogTitleStyles = (theme: Theme): StyleRules =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  });

interface DialogTitleProps extends WithStyles<typeof dialogTitleStyles> {
  id: string;
  onClose: () => void;
  children?: React.ReactNode;
}

const DialogTitle = withStyles(dialogTitleStyles)((props: DialogTitleProps) => {
  const { classes, children, onClose, ...other } = props;

  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton
          aria-label="download-confirmation-close"
          className={classes.closeButton}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

interface DownloadConfirmDialogProps {
  totalSize: number;
  setOpen: boolean;
  setClose: () => void;
}

const DownloadConfirmDialog: React.FC<DownloadConfirmDialogProps> = (
  props: DownloadConfirmDialogProps
) => {
  // TODO: Temporary facilityName until we load it from settings.
  const facilityName = 'LILS';

  const defaultAccessMethod = 'https';
  const { totalSize } = props;
  const [connSpeed, setConnSpeed] = React.useState<number>(1);
  const [downloadTime, setDownloadTime] = React.useState<number>(-1);

  // Submit values.
  const [downloadName, setDownloadName] = React.useState<string>('');
  const [accessMethod, setAccessMethod] = React.useState<string>(
    defaultAccessMethod
  );
  const [emailAddress, setEmailAddress] = React.useState<string>('');

  const emailHelpText = 'Send me download status messages via email.';
  const emailErrorText = 'Please ensure the email you have entered is valid.';
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const [emailValid, setEmailValid] = React.useState<boolean>(true);
  const [emailHelperText, setEmailHelperText] = React.useState<string>(
    emailHelpText
  );

  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = React.useState<boolean>(
    false
  );

  const getDefaultFileName = (): string => {
    const now = new Date();
    let defaultName = `${facilityName}_${now.getFullYear()}-${now.getMonth() +
      1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;

    return defaultName;
  };

  useEffect(() => {
    setDownloadTime(totalSize / (1024 * 1024) / (connSpeed / 8));
  }, [connSpeed, totalSize]);

  useEffect(() => {
    if (props.setOpen) {
      // console.log('Got dialog open');

      // Reset checkmark view.
      setIsSubmitted(false);
      setIsSubmitSuccessful(false);

      // Reset all fields for next time dialog is opened.
      setDownloadName('');
      setAccessMethod(defaultAccessMethod);
      setEmailAddress('');
    }
  }, [props.setOpen]);

  const secondsToDHMS = (seconds: number): string => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    // TODO: Any need for days?
    const dDisplay = d > 0 ? d + (d === 1 ? ' day, ' : ' days, ') : '';
    const hDisplay = h > 0 ? h + (h === 1 ? ' hour, ' : ' hours, ') : '';
    const mDisplay = m > 0 ? m + (m === 1 ? ' minute, ' : ' minutes, ') : '';
    const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';

    return dDisplay + hDisplay + mDisplay + sDisplay;
  };

  const processDownload = async (): Promise<void> => {
    console.log(
      `Submit Cart: ${facilityName}, ${downloadName}, ${accessMethod}, ${emailAddress}`
    );

    // Check for file name, if there hasn't been one entered,
    // then generate a default one and update state for rendering later.
    let fileName = downloadName;
    if (!fileName) {
      fileName = getDefaultFileName();
      setDownloadName(fileName);
    }

    let downloadId = await submitCart(
      facilityName,
      accessMethod,
      emailAddress,
      fileName
    );
    console.log('Returned downloadID ', downloadId);

    // Ensure that we have received a downloadId.
    if (downloadId && downloadId !== -1) {
      // If we are using HTTPS then start the download using
      // the download ID we received.
      if (accessMethod === defaultAccessMethod)
        downloadPreparedCart(downloadId, fileName);
      setIsSubmitSuccessful(true);
    }

    // Enable submitted view.
    setIsSubmitted(true);
  };

  return (
    <Dialog
      onClose={props.setClose}
      open={props.setOpen}
      // TODO: Set size another way; should have width without this?
      fullWidth={true}
      maxWidth={'sm'}
    >
      {!isSubmitted ? (
        <div>
          {/* Custom title component which has a close button */}
          <DialogTitle
            id="download-confirm-dialog-title"
            onClose={props.setClose}
          >
            Confirm Your Download
          </DialogTitle>

          {/* The download confirmation form  */}
          <DialogContent>
            <Grid container spacing={2}>
              {/* Set the download name text field */}
              <Grid item xs={12}>
                {/* <FormControl> */}
                {/* // TODO: fullWidth={true} works on components normally but we want them to size depending on parent. */}
                <TextField
                  id="confirm-download-name"
                  label="Download Name (optional)"
                  placeholder={`${getDefaultFileName()}`}
                  fullWidth={true}
                  // TODO: Set a maxLength?
                  inputProps={{
                    maxLength: 255,
                  }}
                  onChange={(
                    event: React.ChangeEvent<{ value: unknown }>
                  ): void => {
                    console.log('Set download name: ', event.target.value);
                    setDownloadName(event.target.value as string);
                  }}
                  helperText="Enter a custom file name or leave as the default format (facility_date_time)."
                />
                {/* </FormControl> */}
              </Grid>

              {/* Select the access method */}
              <Grid item xs={12}>
                <FormControl style={{ minWidth: 120 }}>
                  <InputLabel id="confirm-access-method-label">
                    Access Method
                  </InputLabel>
                  <Select
                    labelId="confirm-access-method"
                    id="confirm-access-method"
                    defaultValue={`${defaultAccessMethod}`}
                    onChange={(
                      event: React.ChangeEvent<{ value: unknown }>
                    ): void => {
                      console.log(
                        'Selected access method: ',
                        event.target.value
                      );

                      // Material UI select is not a real select element, so needs casting.
                      setAccessMethod(event.target.value as string);
                    }}
                  >
                    <MenuItem value="https">HTTPS</MenuItem>
                    <MenuItem value="globus">Globus</MenuItem>
                  </Select>

                  {/* Provide some information on the selected access method. */}
                  <Typography style={{ paddingTop: '20px' }}>
                    <b>Access Method Information:</b>
                  </Typography>

                  {/* TODO: Could this be neater? */}
                  {/* Depending on the type of access method that has been selected,
                  show specific access information. */}
                  {(() => {
                    switch (accessMethod) {
                      case defaultAccessMethod:
                        return (
                          <Typography>
                            HTTPS is the default access method.
                          </Typography>
                        );
                      case 'globus':
                        return (
                          <Typography>
                            Globus is a special access method.
                          </Typography>
                        );
                      default:
                        return null;
                    }
                  })()}
                </FormControl>
              </Grid>

              {/* Get the size of the download  */}
              <Grid item xs={12}>
                <Typography>
                  <b>Download size:</b> {formatBytes(totalSize)}
                </Typography>
              </Grid>

              {/* Select and estimate the download time */}
              <Grid item xs={12}>
                <Typography>My connection speed: </Typography>
                <FormControl style={{ minWidth: 120 }}>
                  <Select
                    labelId="confirm-connection-speed"
                    id="confirm-connection-speed"
                    defaultValue={1}
                    onChange={(
                      event: React.ChangeEvent<{ value: unknown }>
                    ): void => {
                      // Material UI select is not a real select element, so needs casting.
                      setConnSpeed(event.target.value as number);
                    }}
                  >
                    <MenuItem value={1}>1 Mbps</MenuItem>
                    <MenuItem value={30}>30 Mbps</MenuItem>
                    <MenuItem value={100}>100 Mbps</MenuItem>
                  </Select>
                  <FormHelperText id="confirm-connection-speed-help">
                    Select a connection speed to approximate download time.
                  </FormHelperText>
                </FormControl>
              </Grid>
              {/* TODO: Position the download time next to connection speed select dropbox */}
              <Grid item xs={12}>
                <Typography>
                  <b>Estimated download time</b> (at {connSpeed} Mbps):
                </Typography>
                <Typography>{secondsToDHMS(downloadTime)}</Typography>
              </Grid>

              {/* Set the download name text field */}
              <Grid item xs={12}>
                {/* <FormControl> */}
                {/* // TODO: fullWidth={true} works on components normally but we want them to size depending on parent. */}
                <TextField
                  id="confirm-download-email"
                  label="Email Address (optional)"
                  fullWidth={true}
                  helperText={emailHelperText}
                  error={!emailValid}
                  // TODO: Set a maxLength?
                  inputProps={{
                    maxLength: 254,
                  }}
                  // TODO: We could use debounce to evaluate if the email address is valid
                  //       after the user has finished typing it.
                  onChange={(
                    event: React.ChangeEvent<{ value: unknown }>
                  ): void => {
                    console.log(
                      'Changed email address: ',
                      event.target.value as string
                    );

                    // Remove whitespaces and allow for the email to be optional.
                    const email = (event.target.value as string).trim();
                    if (email) {
                      if (emailRegex.test(email)) {
                        // Material UI select is not a real select element, so needs casting.
                        setEmailAddress(email);

                        if (emailHelperText !== emailHelpText)
                          setEmailHelperText(emailHelpText);
                        setEmailValid(true);

                        console.log('Set valid email');
                      } else {
                        if (emailHelperText !== emailErrorText)
                          setEmailHelperText(emailErrorText);
                        setEmailValid(false);

                        console.log('Set invalid email');
                      }
                    } else if (!emailValid) {
                      // Allow for the error to toggle off, if there is
                      // no longer an email entered in the text field.
                      setEmailAddress('');
                      setEmailHelperText(emailHelpText);
                      setEmailValid(true);
                    }
                  }}
                />
                {/* </FormControl> */}
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button
              id="download-confirmation-download"
              // TODO: Download button disables if email is invalid, potentially use debounce?
              disabled={!emailValid}
              onClick={processDownload}
              color="primary"
              variant="contained"
            >
              Download
            </Button>
          </DialogActions>
        </div>
      ) : (
        <div>
          <DialogTitle
            id="download-confirm-dialog-title"
            onClose={props.setClose}
          />

          <DialogContent>
            <Grid
              container
              spacing={4}
              direction="column"
              alignItems="center"
              justify="center"
              style={{ paddingBottom: '25px' }}
            >
              <Grid item xs>
                {/* TODO: When closing the animation renders again? 
                      Maybe set a fixed width for the dialog and not render it? */}
                {isSubmitSuccessful ? (
                  <Mark size={100} colour="#3E863E" />
                ) : (
                  <Mark size={100} colour="#A91B2E" isCross={true} />
                )}
              </Grid>

              {isSubmitSuccessful ? (
                <Grid item xs>
                  {accessMethod === defaultAccessMethod ? (
                    <Typography id="download-confirmation-success-default">
                      Successfully submitted and started download
                    </Typography>
                  ) : (
                    <Typography id="download-confirmation-success-other">
                      Successfully created download
                    </Typography>
                  )}
                </Grid>
              ) : (
                <div
                  id="download-confirmation-unsuccessful"
                  style={{ textAlign: 'center' }}
                >
                  <Typography>
                    <b>Your download request was unsuccessful</b>
                  </Typography>
                  <Typography>
                    (No download information was received)
                  </Typography>
                </div>
              )}

              {/* Grid to show submitted download information */}
              {isSubmitSuccessful && (
                <Grid item xs>
                  <div style={{ textAlign: 'center', margin: '0 auto' }}>
                    <div style={{ float: 'left', textAlign: 'right' }}>
                      <Typography>
                        <b>Download Name: </b>
                      </Typography>
                      <Typography>
                        <b>Access Method: </b>
                      </Typography>
                      {emailAddress && (
                        <Typography>
                          <b>Email Address: </b>
                        </Typography>
                      )}
                    </div>
                    <div
                      style={{
                        float: 'right',
                        textAlign: 'left',
                        paddingLeft: '25px',
                      }}
                    >
                      <Typography>{downloadName}</Typography>
                      <Typography>{accessMethod.toUpperCase()}</Typography>
                      {emailAddress && <Typography>{emailAddress}</Typography>}
                    </div>
                  </div>
                </Grid>
              )}

              {isSubmitSuccessful && (
                <Grid item xs>
                  <Button
                    id="download-confirmation-status-link"
                    variant="outlined"
                    color="primary"
                    href="/status"
                  >
                    View My Downloads
                  </Button>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        </div>
      )}
    </Dialog>
  );
};

// TODO: Pass in facilityName as prop to DownloadConfirmDialog to get customisable download name.

export default DownloadConfirmDialog;
