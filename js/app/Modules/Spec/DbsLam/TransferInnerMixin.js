Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerMixin',{
	_activeTransferRecord: null,
	_actionTransferStepIdx: null,
	
	initInner: function() {
		
	},
	getActiveTransferStepRecord: function() {
		var ret = null ;
		this._activeTransferRecord.steps().each( function(transferStepRecord) {
			if( transferStepRecord.get('transferstep_idx')==this._actionTransferStepIdx ) {
				ret = transferStepRecord ;
			}
		},this) ;
		return ret ;
	},
	getInnerTitle: function() {
		var transferStepRecord = this.getActiveTransferStepRecord() ;
		if( transferStepRecord ) {
			return transferStepRecord.get('transferstep_txt') ;
		}
	},
	refreshData: function() {
		console.log('default refresh') ;
	},
	
	handleBuildPick: function() {
		console.log('default buildpick') ;
	}
}) ;
