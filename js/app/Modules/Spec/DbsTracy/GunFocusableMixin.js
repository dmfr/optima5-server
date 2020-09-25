Ext.define('Optima5.Modules.Spec.DbsTracy.GunFocusableMixin',{
	
	_component: null,
	
	constructor : function () {
		this.on('beforedestroy',function() {
			this.unregisterFocusableComponent() ;
		},this);
	},
	
	registerFocusableComponent: function(cmp) {
		if( !Optima5.Modules.Spec.DbsTracy.GunHelper.isRegisterFocus() ) {
			return ;
		}
		if( this._component ) {
			this.unregisterFocusableComponent() ;
		}
		this._component = cmp ;
		cmp.on('focus',this.onFocusableComponentFocus,this) ;
		cmp.on('blur',this.onFocusableComponentBlur,this) ;
		Ext.defer(function() {
			cmp.focus();
		},100) ;
	},
	unregisterFocusableComponent: function() {
		if( !this._component ) {
			return ;
		}
		var cmp = this._component ;
		cmp.un('focus',this.onFocusableComponentFocus,this) ;
		cmp.un('blur',this.onFocusableComponentBlur,this) ;
		this._component = null ;
	},
	
	onFocusableComponentFocus: function(cmp) {
		
	},
	onFocusableComponentBlur: function(cmp) {
		Ext.defer(function() {
			cmp.focus() ;
		},100) ;
	}
}) ;
