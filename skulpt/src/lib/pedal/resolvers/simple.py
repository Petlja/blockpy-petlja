from pedal.report import MAIN_REPORT

def select(report=None):
    '''
    Args:
        report (Report): The report object to resolve down. Defaults to the
                         global MAIN_REPORT
    
    Returns
        str: A string of HTML feedback to be delivered
    '''
    if report is None:
        report = MAIN_REPORT
    return True, "Hello world, we are making <b>progress</b>!"
    #return report.feedback[0]
